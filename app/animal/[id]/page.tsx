import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowLeft, Edit } from "lucide-react"
import { getAnimalById } from "@/lib/actions/animals"
import { AnimalProfileContent } from "@/components/animal-profile-content"
import Link from "next/link"

interface AnimalProfilePageProps {
  params: {
    id: string
  }
}

async function AnimalData({ id }: { id: number }) {
  const animal = await getAnimalById(id)

  if (!animal) {
    notFound()
  }

  return <AnimalProfileContent animal={animal} />
}

export default function AnimalProfile({ params }: AnimalProfilePageProps) {
  const animalId = Number.parseInt(params.id)

  if (isNaN(animalId)) {
    notFound()
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
                <Suspense fallback={<div className="h-8 w-48 bg-muted animate-pulse rounded" />}>
                  <h1 className="text-2xl font-bold text-foreground">Animal Profile</h1>
                </Suspense>
                <p className="text-muted-foreground">Animal ID: {animalId}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Animal
            </Button>
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
                    <div key={i} className="h-10 w-32 bg-background animate-pulse rounded" />
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
                            <div key={j} className="h-4 w-20 bg-muted animate-pulse rounded" />
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
          <AnimalData id={animalId} />
        </Suspense>
      </div>
    </div>
  )
}
