import { PrismaClient, District, Equipment } from '@prisma/client'

const prisma = new PrismaClient()

const MUSCLE_MAP: Record<string, District> = {
  "quadriceps": "QUAD",
  "hamstrings": "HAMSTRING",
  "glutes": "GLUTE",
  "lower back": "LOWER_BACK",
  "upper back": "UPPER_BACK",
  "shoulders": "SHOULDER",
  "chest": "CHEST",
  "biceps": "BICEP",
  "triceps": "TRICEP",
  "calves": "CALF",
  "abdominals": "CORE",
  "knees": "KNEE"
}

const EQUIPMENT_MAP: Record<string, Equipment> = {
  "barbell": "BARBELL",
  "dumbbell": "DUMBBELL",
  "cable": "CABLE",
  "machine": "MACHINE",
  "body only": "BODYWEIGHT",
  "kettlebells": "KETTLEBELL",
  "bands": "RESISTANCE_BAND",
  "e-z curl bar": "BARBELL" // Mappato su barbell per semplicità
}

async function main() {
  console.log("Downloading exercise database...")
  
  const res = await fetch("https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json")
  if (!res.ok) {
    throw new Error(`Failed to fetch exercises: ${res.statusText}`)
  }
  
  const exercises = await res.json()
  console.log(`Found ${exercises.length} exercises. Processing...`)

  let imported = 0
  let skipped = 0

  for (const ex of exercises) {
    // Check if equipment is mappable
    const mappedEq = EQUIPMENT_MAP[ex.equipment?.toLowerCase()]
    if (!mappedEq) {
      skipped++
      continue
    }

    // Map muscles
    const primaryMuscles: District[] = []
    if (MUSCLE_MAP[ex.targetMuscle?.toLowerCase()]) {
      primaryMuscles.push(MUSCLE_MAP[ex.targetMuscle.toLowerCase()])
    }

    const secondaryMuscles: District[] = []
    if (ex.synergistMuscles && Array.isArray(ex.synergistMuscles)) {
      ex.synergistMuscles.forEach((m: string) => {
        if (MUSCLE_MAP[m.toLowerCase()]) {
          secondaryMuscles.push(MUSCLE_MAP[m.toLowerCase()])
        }
      })
    }

    // Determine if compound (heuristics: more than 1 muscle involved, or specific mechanics)
    const isCompound = primaryMuscles.length + secondaryMuscles.length > 1 || ex.mechanic === "compound"

    // Map difficulty
    let difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" = "INTERMEDIATE"
    if (ex.level === "beginner") difficulty = "BEGINNER"
    if (ex.level === "expert") difficulty = "ADVANCED"

    try {
      await prisma.exerciseDefinition.upsert({
        where: { name: ex.name },
        update: {
          primaryMuscles,
          secondaryMuscles,
          equipment: mappedEq,
          isCompound,
          difficulty,
          description: ex.instructions ? ex.instructions.join("\n") : undefined
        },
        create: {
          name: ex.name,
          primaryMuscles,
          secondaryMuscles,
          equipment: mappedEq,
          isCompound,
          difficulty,
          description: ex.instructions ? ex.instructions.join("\n") : undefined
        }
      })
      imported++
    } catch (e) {
      console.error(`Error importing ${ex.name}:`, e)
    }
  }

  console.log(`Done! Imported: ${imported} | Skipped: ${skipped}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
