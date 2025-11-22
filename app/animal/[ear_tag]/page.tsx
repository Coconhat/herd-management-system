import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Edit, Printer } from "lucide-react";
import { getAnimalByEarTag, getAnimalById } from "@/lib/actions/animals";
import { AnimalProfileContent } from "@/components/animal-profile-content";
import Link from "next/link";

interface AnimalProfilePageProps {
  params: {
    ear_tag: string;
  };
}

async function AnimalData({ ear_tag }: { ear_tag: string }) {
  const animal = await getAnimalByEarTag(ear_tag);

  if (!animal) {
    notFound();
  }

  return <AnimalProfileContent animal={animal} />;
}

export default function AnimalProfile({ params }: AnimalProfilePageProps) {
  const animalEarTag = params.ear_tag;

  if (!animalEarTag) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <Suspense
                  fallback={
                    <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                  }
                >
                  <h1 className="text-2xl font-bold text-foreground">
                    Animal Profile
                  </h1>
                </Suspense>
                <p className="text-muted-foreground">
                  Animal Ear Tag: {animalEarTag}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/animal/${animalEarTag}/edit`}
                className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Animal
              </Link>
              <Link
                href={`/animal/${animalEarTag}/print`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print Sheet
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Suspense
          fallback={
            <div className="space-y-6">
              {/* Animal Basic Info Loading */}
              <Card>
                <CardHeader>
                  <div className="h-6 w-40 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                      <div key={i}>
                        <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
                        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tabs Loading */}
              <div className="space-y-4">
                <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 w-32 bg-background animate-pulse rounded"
                    />
                  ))}
                </div>
                <Card>
                  <CardHeader>
                    <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex space-x-4">
                          {[...Array(6)].map((_, j) => (
                            <div
                              key={j}
                              className="h-4 w-20 bg-muted animate-pulse rounded"
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          }
        >
          <AnimalData ear_tag={animalEarTag} />
        </Suspense>
      </div>
    </div>
  );
}
