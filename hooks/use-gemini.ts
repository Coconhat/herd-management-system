"use client";

import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/client";

// Your complete database schema
const DATABASE_SCHEMA = `
# DH Magpantay Farm Database Schema

## Table: animals
- id: integer (primary key)
- ear_tag: text (unique identifier for each animal)
- name: text (optional name)
- birth_date: date
- sex: text ('Male' or 'Female')
- dam_id: integer (mother's id, foreign key to animals.id)
- sire_id: integer (father's id, foreign key to animals.id)
- farm_source: text (where animal came from)
- status: text (Active, Sold, Deceased, Culled, Pregnant, Fresh, Open, Empty, Dry)
- breed: text
- expected_calving_date: date (for pregnant animals)
- reopen_date: date (when animal can be bred again after calving)
- notes: text
- user_id: uuid (owner)
- created_at: timestamp
- updated_at: timestamp

## Table: breeding_records
- id: integer (primary key)
- user_id: uuid
- animal_id: integer (foreign key to animals.id)
- sire_ear_tag: text (bull's ear tag)
- breeding_date: date
- breeding_method: text ('Natural' or 'AI')
- pd_result: text ('Pregnant', 'Empty', 'Unchecked')
- pregnancy_check_date: date
- heat_check_date: date
- pregnancy_check_due_date: date
- expected_calving_date: date
- notification_date: date
- post_pd_treatment_due_date: date
- keep_in_breeding_until: date
- confirmed_pregnant: boolean
- notes: text
- created_at: timestamp

## Table: calvings
- id: integer (primary key)
- animal_id: integer (dam, foreign key to animals.id)
- calving_date: date
- calf_ear_tag: text (newborn's tag)
- calf_sex: text ('Male' or 'Female')
- birth_weight: decimal
- complications: text
- assistance_required: boolean
- sire_id: text (bull's ear tag)
- breeding_id: text (related breeding record)
- notes: text
- user_id: uuid
- created_at: timestamp

## Table: health_records
- id: serial (primary key)
- animal_id: integer (foreign key to animals.id)
- record_date: date
- record_type: varchar(50) (e.g., 'Vaccination', 'Treatment', 'Checkup', 'Medicine')
- description: text
- treatment: text
- veterinarian: varchar(100)
- notes: text
- user_id: uuid
- created_at: timestamp
- ml: integer (milliliters of medication)
- medication: varchar (name of medication used)

## Table: diesel
- id: uuid (primary key)
- event_date: timestamp with time zone
- volume_liters: numeric(10,2) (amount of diesel in liters)
- reference: text (receipt or reference number)
- recorded_by: text (who recorded the entry)
- type: text ('addition' or 'usage' - default is 'addition')

## Table: feeds
- id: uuid (primary key)
- event_date: timestamp with time zone
- feeds: numeric(10,2) (amount of feed, e.g., in kg or bags)
- reference: text (receipt or reference number)
- recorded_by: text (who recorded the entry)

## Important Relationships:
- animals.dam_id → animals.id (mother reference)
- animals.sire_id → animals.id (father reference)
- breeding_records.animal_id → animals.id
- calvings.animal_id → animals.id
- health_records.animal_id → animals.id

## Common Queries:
- Get all pregnant animals: SELECT * FROM animals WHERE status = 'Pregnant'
- Get breeding history: SELECT * FROM breeding_records WHERE animal_id = X ORDER BY breeding_date DESC
- Get calving history: SELECT * FROM calvings WHERE animal_id = X ORDER BY calving_date DESC
- Animals ready for breeding: SELECT * FROM animals WHERE status IN ('Empty', 'Open') AND reopen_date <= CURRENT_DATE
- Get health records for an animal: SELECT * FROM health_records WHERE animal_id = X ORDER BY record_date DESC
- Get diesel usage: SELECT * FROM diesel ORDER BY event_date DESC
- Get feed records: SELECT * FROM feeds ORDER BY event_date DESC
- Total diesel added: SELECT SUM(volume_liters) FROM diesel WHERE type = 'addition'
- Total diesel used: SELECT SUM(volume_liters) FROM diesel WHERE type = 'usage'
`;

const SYSTEM_PROMPT = `
You are the AI assistant for DH Magpantay Farm, a cattle breeding and management operation. YOUR NAME IS "Cassie". Your role is to help the farm manager retrieve and analyze data from their farm database based on user questions.

You have access to a PostgreSQL database via Supabase. When users ask questions about farm data:

1. Generate a SQL query based on the schema provided
2. The query will be executed safely and results returned to you
3. Format the results in a user-friendly way

## Available Function:
- executeQuery: Execute a SQL SELECT query against the database

## Rules:
- ONLY generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, etc.)
- Always use proper JOINs when accessing related tables
- Be mindful of performance - use LIMIT when appropriate
- Handle NULL values gracefully
- Use proper date comparisons
- Always filter by user_id when relevant (though this is handled automatically)

## Communication Style:
- Be conversational and friendly
- Explain what data you're retrieving
- Suggest follow-up questions when relevant

## IMPORTANT - Data Formatting Rules:
When presenting multiple records, ALWAYS format them in a clear, grouped way:

For lists of records, use this format with clear visual separation:

---
**Record 1**
Field: Value
Field: Value
---
**Record 2**
Field: Value
Field: Value
---

Or use a numbered list with clear grouping:

1. **[Primary Identifier]**
   - Field: Value
   - Field: Value

2. **[Primary Identifier]**
   - Field: Value
   - Field: Value

NEVER list all fields as a flat bullet list without grouping. Each record should be visually distinct and easy to scan.

For calving records, group by calving and show: Date, Dam (ear tag if possible), Calf Tag, Sex, Weight, Sire.
For breeding records, group by record and show: Date, Animal, Method, Status/Result.
For health records, group by record and show: Date, Animal, Type, Treatment, Medication.

${DATABASE_SCHEMA}
`;

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(API_KEY);

const tools: any = [
  {
    functionDeclarations: [
      {
        name: "executeQuery",
        description:
          "Execute a SELECT SQL query against the farm database. Only SELECT queries are allowed.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "The SQL SELECT query to execute. Must be a valid PostgreSQL SELECT statement.",
            },
            explanation: {
              type: "string",
              description:
                "A brief explanation of what this query does for logging purposes",
            },
          },
          required: ["query", "explanation"],
        },
      },
    ],
  },
];

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
  tools,
});

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

// Safe query execution function
async function executeQuery(rawQuery: string, explanation: string) {
  const supabase = createClient();

  const query = sanitizeQuery(rawQuery);

  if (!query) {
    throw new Error("Query is empty after sanitization");
  }

  // Security: Only allow SELECT queries
  const normalizedQuery = query.trim().toUpperCase();
  if (!normalizedQuery.startsWith("SELECT")) {
    throw new Error("Only SELECT queries are allowed");
  }

  // Prevent dangerous operations
  const dangerousKeywords = [
    "DROP",
    "DELETE",
    "UPDATE",
    "INSERT",
    "ALTER",
    "TRUNCATE",
    "CREATE",
  ];
  for (const keyword of dangerousKeywords) {
    if (normalizedQuery.includes(keyword)) {
      throw new Error(`Query contains prohibited keyword: ${keyword}`);
    }
  }

  console.log("🔍 Executing query:", explanation);
  console.log("📝 SQL:", query);

  try {
    // Execute the raw SQL query
    const { data, error } = await supabase.rpc("execute_sql", {
      query_text: query,
    });

    if (error) {
      // If RPC doesn't exist, fall back to using the query builder
      console.warn("RPC not available, using alternative method");
      return await executeWithQueryBuilder(query);
    }

    if (isRpcErrorPayload(data)) {
      throw new Error(data.error ?? "Unknown query error");
    }

    if (Array.isArray(data)) {
      console.log("✅ Query returned", data.length, "rows");
      return data;
    }

    console.log("✅ Query executed, returning normalized payload");
    return data;
  } catch (err: any) {
    console.error("❌ Query error:", err.message);
    throw new Error(`Database query failed: ${err.message}`);
  }
}

// Fallback: Parse simple queries and use Supabase query builder
async function executeWithQueryBuilder(query: string) {
  const supabase = createClient();

  // Simple parser for basic SELECT queries
  const match = query.match(
    /SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?/i
  );

  if (!match) {
    throw new Error("Complex query not supported without RPC function");
  }

  const [, columns, table, whereClause, orderBy, limit] = match;

  let queryBuilder = supabase.from(table).select(columns.trim());

  // Basic WHERE parsing (only handles simple cases)
  if (whereClause) {
    const conditions = whereClause.split("AND").map((c) => c.trim());
    for (const condition of conditions) {
      const eqMatch = condition.match(/(\w+)\s*=\s*'([^']+)'/);
      if (eqMatch) {
        queryBuilder = queryBuilder.eq(eqMatch[1], eqMatch[2]);
      }
    }
  }

  if (orderBy) {
    const [col, dir] = orderBy.trim().split(/\s+/);
    queryBuilder = queryBuilder.order(col, {
      ascending: dir?.toUpperCase() !== "DESC",
    });
  }

  if (limit) {
    queryBuilder = queryBuilder.limit(parseInt(limit));
  }

  const { data, error } = await queryBuilder;

  if (error) throw error;
  return data;
}

function sanitizeQuery(query: string) {
  return query.replace(/;\s*$/g, "").trim();
}

function isRpcErrorPayload(
  data: unknown
): data is { error?: string; hint?: string } {
  return (
    !!data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    ("error" in data || "hint" in data)
  );
}

export function useGeminiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(prompt: string) {
    if (!prompt.trim()) return;
    setError(null);
    setLoading(true);

    const userMsg: ChatMessage = { role: "user", text: prompt };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const chat = model.startChat({
        history: messages.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        })),
      });

      let currentResponse = await chat.sendMessage(prompt);
      let pendingCalls = currentResponse.response.functionCalls();

      while (pendingCalls && pendingCalls.length > 0) {
        console.log("🤖 AI requested", pendingCalls.length, "tool call(s)");

        for (const call of pendingCalls) {
          const args = (call.args ?? {}) as {
            query?: string;
            explanation?: string;
          };

          let functionPayload: unknown;

          try {
            if (call.name === "executeQuery") {
              const result = await executeQuery(
                args.query ?? "",
                args.explanation ?? "AI-generated query"
              );

              // Ensure result is JSON serializable
              functionPayload = {
                rows: JSON.parse(JSON.stringify(result)),
              };
            } else {
              functionPayload = {
                error: `Function ${call.name} is not implemented`,
              };
            }
          } catch (err: any) {
            console.error("Error executing tool:", err);
            functionPayload = {
              error: err.message ?? "Unknown tool error",
            };
          }

          currentResponse = await chat.sendMessage([
            {
              functionResponse: {
                name: call.name,
                response: functionPayload,
              },
            },
          ] as unknown as Parameters<(typeof chat)["sendMessage"]>[0]);
        }

        pendingCalls = currentResponse.response.functionCalls();
      }

      const reply = currentResponse.response.text();
      const aiMsg: ChatMessage = {
        role: "assistant",
        text: stripBasicMarkdown(reply),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setError("Failed to get response. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
  }

  return {
    messages,
    sendMessage,
    clearChat,
    loading,
    error,
  };
}

function stripBasicMarkdown(text: string) {
  return (
    text
      // Remove bold markers
      .replace(/\*\*(.*?)\*\*/g, "$1")
      // Remove italic markers
      .replace(/\*(.*?)\*/g, "$1")
      // Convert bullet points (* item) to proper dash format
      .replace(/^\s*\*\s+/gm, "• ")
      // Remove any remaining standalone asterisks used as bullets
      .replace(/\n\s*\*\s*/g, "\n• ")
      // Clean up any double spaces
      .replace(/  +/g, " ")
      .trim()
  );
}
