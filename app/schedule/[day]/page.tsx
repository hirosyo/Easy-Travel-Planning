import { DaySchedule } from "@/components/day-schedule"

export default function SchedulePage({ params }: { params: { day: string } }) {
  const day = Number.parseInt(params.day)

  return (
    <div className="container mx-auto p-4">
      <DaySchedule day={day} />
    </div>
  )
}
