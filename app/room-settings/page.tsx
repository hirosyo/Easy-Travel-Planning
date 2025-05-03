import { RoomSettingsForm } from "@/components/room-settings-form"

export default function RoomSettingsPage() {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Room Settings</h1>
      <RoomSettingsForm />
    </div>
  )
}
