"use client"

import type React from "react"

import { useState, useEffect, forwardRef, MouseEventHandler } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format, parse } from "date-fns"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"


type Member = {
  id: string
  name: string
}

type Room = {
  id: string
  password: string
  name: string
  days: number
  members: Member[]
  created: number
  date: string  //日付のプロパティ
}

// カレンダー開閉用のカスタム input
const CalendarInput = forwardRef<HTMLInputElement, { value?: string; onClick?: MouseEventHandler<HTMLInputElement> }>(
  ({ value, onClick }, ref) => (
    <Input
      ref={ref}
      value={value}
      readOnly
      onClick={onClick}
      placeholder="YYYY/MM/DD"
    />
  )
)
CalendarInput.displayName = "CalendarInput"

export function RoomSettingsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isNewRoom, setIsNewRoom] = useState(true)
  const [roomId, setRoomId] = useState("")
  const [password, setPassword] = useState("")
  const [members, setMembers] = useState<Member[]>([
    { id: "1", name: "A" },
    { id: "2", name: "B" },
    { id: "3", name: "C" },
  ])
  const [days, setDays] = useState(3)
  const [roomName, setRoomName] = useState("Trip")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [showCalendar, setShowCalendar] = useState(false)

  const router = useRouter()

  useEffect(() => {
    // Check if we're editing an existing room
    const currentRoomId = localStorage.getItem("currentRoomId")
    if (currentRoomId) {
      const existingRooms = JSON.parse(localStorage.getItem("travelRooms") || "[]")
      const currentRoom = existingRooms.find((room: Room) => room.id === currentRoomId)

      if (currentRoom) {
        setIsNewRoom(false)
        setRoomId(currentRoom.id)
        setPassword(currentRoom.password)
        setRoomName(currentRoom.name)
        setDays(currentRoom.days)
        setMembers(currentRoom.members)
        const parsedDate = parse(currentRoom.date, "yyyy/MM/dd", new Date())
        setSelectedDate(parsedDate)
      }
    } else {
        setIsNewRoom(true)
    }
  }, [])


  const handleDayClick = (day: Date) => {
    setSelectedDate(day)
    setShowCalendar(false)
  }
 


  const addMember = () => {
    const newId = (members.length + 1).toString()
    setMembers([...members, { id: newId, name: "" }])
  }

  const updateMember = (id: string, name: string) => {
    setMembers(members.map((member) => (member.id === id ? { ...member, name } : member)))
  }

  const removeMember = (id: string) => {
    if (members.length > 1) {
      setMembers(members.filter((member) => member.id !== id))
    } else {
      toast({
        title: "Cannot remove member",
        description: "You need at least one member in the room",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate form
    if (!selectedDate) {
      toast({ title: "Please select a date", variant: "destructive" })
      return
    }

    if (members.some((member) => !member.name.trim())) {
      toast({
        title: "Invalid member name",
        description: "All members must have a name",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Create or update room
    const room: Room = {
      id: roomId,
      password,
      name: roomName,
      days,
      members,
      created: Date.now(),
      date: format(selectedDate, "yyyy/MM/dd"),
    }

    // Save to localStorage
    const existingRooms = JSON.parse(localStorage.getItem("travelRooms") || "[]")

    if (isNewRoom) {
      localStorage.setItem("travelRooms", JSON.stringify([...existingRooms, room]))
    } else {
      localStorage.setItem("travelRooms", JSON.stringify(existingRooms.map((r: Room) => (r.id === roomId ? room : r))))
    }

    // Set current room
    localStorage.setItem("currentRoomId", roomId)

    // Clear any existing events for this room if it's new
    if (isNewRoom) {
      for (let i = 1; i <= days; i++) {
        localStorage.setItem(`events_${roomId}_day_${i}`, JSON.stringify([]))
      }
    }

    setTimeout(() => {
      toast({
        title: isNewRoom ? "Room created" : "Room updated",
        description: `Room ID: ${roomId}`,
      })
      router.push("/schedule/1")
    }, 1000)
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{isNewRoom ? "Create New Room" : "Edit Room"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="roomName">Trip Name</Label>
            <Input id="roomName" value={roomName} onChange={(e) => setRoomName(e.target.value)} required />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roomId">Room ID</Label>
              {isNewRoom ? (<Input id="roomId" value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder= "e.g. trip_2025_5" required/>):(<Input id="roomId" value={roomId} className="bg-gray-50" readOnly/>)}
              <p className="text-xs text-gray-500">Share this ID with your travel companions</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder= "e.g. trip_pass" required/>
              <p className="text-xs text-gray-500">Keep this password secure</p>
            </div>
          </div>

          <div className="relative space-y-2">
            <Label htmlFor="date">Travel Date</Label>
            <CalendarInput
              id="date"
              value={selectedDate ? format(selectedDate, "yyyy/MM/dd") : ""}
              onClick={() => setShowCalendar(!showCalendar)}
            />
            {showCalendar && (
              <div className="absolute z-10 mt-1 bg-white shadow-lg">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDayClick}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="days">Number of Days</Label>
            <Input
              id="days"
              type="number"
              min="1"
              max="14"
              value={days}
              onChange={(e) => setDays(Number.parseInt(e.target.value))}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Trip Members</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMember}>
                <Plus className="h-4 w-4 mr-1" /> Add Member
              </Button>
            </div>

            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <Input
                    value={member.name}
                    onChange={(e) => updateMember(member.id, e.target.value)}
                    placeholder="Member name"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMember(member.id)}
                    disabled={members.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save and Continue"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
