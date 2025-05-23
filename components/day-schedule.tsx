"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-media-query"
import { toast } from "@/components/ui/use-toast"
import { ChevronLeft, ChevronRight, Plus, Settings, ExternalLink, Edit } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type ScheduleEvent = {
  id: string
  subject: string
  startTime: string
  endTime: string
  paidBy: string
  amount: number
  url: string
  color: string
}

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
  date: string //日付のプロパティ
}

const EVENT_COLORS = [
  "bg-red-300",
  "bg-blue-300",
  "bg-green-300",
  "bg-yellow-300",
  "bg-purple-300",
  "bg-pink-300",
  "bg-indigo-300",
]

export function DaySchedule({ day }: { day: number }) {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [totalDays, setTotalDays] = useState(3)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [roomName, setRoomName] = useState("")
  const [roomId, setRoomId] = useState("")
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<ScheduleEvent | null>(null)
  const [newEvent, setNewEvent] = useState<Omit<ScheduleEvent, "id">>({
    subject: "",
    startTime: "09:00",
    endTime: "10:00",
    paidBy: "",
    amount: 0,
    url: "",
    color: EVENT_COLORS[0],
  })
  const router = useRouter()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const PaymentMatrix = ({
    members,
    balances,
  }: {
    members: Member[]
    balances: Record<string, Record<string, number>>
  }) => {
    const getNetBalance = (memberId: string) => {
      const toReceive = members.reduce((sum, other) => {
        if (other.id !== memberId) {
          return sum + (balances[other.id]?.[memberId] || 0)
        }
        return sum
      }, 0)
      const toPay = Object.values(balances[memberId] || {}).reduce((sum, val) => sum + val, 0)
      return toReceive - toPay
    }

    return (
      <div className="overflow-auto border rounded-md mt-4">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Payer/Receiver</th>
              {members.map((m) => (
                <th key={m.id} className="p-2 border text-center">
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((payer) => (
              <tr key={payer.id} className="border-t">
                <td className="p-2 border font-medium">{payer.name}</td>
                {members.map((receiver) => (
                  <td key={receiver.id} className="p-2 border text-right">
                    {payer.id === receiver.id
                      ? "-"
                      : balances[payer.id]?.[receiver.id]
                      ? `¥${balances[payer.id][receiver.id].toLocaleString()}`
                      : ""}
                  </td>
                ))}

              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 space-y-2">
  {members.map((member) => {
    const receive = Object.values(balances)
      .map((row) => row[member.id] || 0)
      .reduce((a, b) => a + b, 0)
    const pay = Object.values(balances[member.id] || {})
      .reduce((a, b) => a + b, 0)
    const net = receive - pay
    const color = net > 0 ? "text-green-600" : net < 0 ? "text-red-600" : "text-gray-700"

    return (
      <div key={member.id} className="text-sm">
        {member.name} の合計収支：<span className={`font-semibold ${color}`}>¥{net.toLocaleString()}</span>
      </div>
    )
  })}
</div>

      </div>
    )
  }

  useEffect(() => {
    // Load room data
    const currentRoomId = localStorage.getItem("currentRoomId")

    if (!currentRoomId) {
      toast({
        title: "No room selected",
        description: "Please create or join a room first",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    setRoomId(currentRoomId)

    const existingRooms = JSON.parse(localStorage.getItem("travelRooms") || "[]")
    const currentRoom = existingRooms.find((room: Room) => room.id === currentRoomId)

    if (currentRoom) {
      setMembers(currentRoom.members)
      setTotalDays(currentRoom.days)
      setRoomName(currentRoom.name)
      setSelectedDate(currentRoom.date)

      // Load events for this day
      const savedEvents = localStorage.getItem(`events_${currentRoomId}_day_${day}`)
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents))
      }
    } else {
      toast({
        title: "Room not found",
        description: "The selected room could not be found",
        variant: "destructive",
      })
      router.push("/")
    }
  }, [day, router])

  useEffect(() => {
    // Scroll to 9:00 AM by default
    if (scrollContainerRef.current) {
      const scrollTarget = document.getElementById("time-09:00")
      if (scrollTarget) {
        scrollContainerRef.current.scrollTop = scrollTarget.offsetTop - 100
      }
    }
  }, [])

  const handleAddOrUpdateEvent = () => {
    if (!newEvent.subject.trim()) {
      toast({
        title: "Missing subject",
        description: "Please enter a subject for the event",
        variant: "destructive",
      })
      return
    }

    if (!newEvent.paidBy) {
      toast({
        title: "Missing payer",
        description: "Please select who is paying for this event",
        variant: "destructive",
      })
      return
    }

    let updatedEvents: ScheduleEvent[]

    if (isEditMode && currentEvent) {
      // Update existing event
      updatedEvents = events.map((event) =>
        event.id === currentEvent.id ? { ...event, ...newEvent, id: currentEvent.id } : event,
      )
      toast({
        title: "Event updated",
        description: `${newEvent.subject} has been updated`,
      })
    } else {
      // Add new event
      const newId = Date.now().toString()
      const eventToAdd = { id: newId, ...newEvent }
      updatedEvents = [...events, eventToAdd]
      toast({
        title: "Event added",
        description: `${newEvent.subject} has been added to your schedule`,
      })
    }

    setEvents(updatedEvents)

    // Save to localStorage
    localStorage.setItem(`events_${roomId}_day_${day}`, JSON.stringify(updatedEvents))

    // Reset form and close dialog
    resetEventForm()
    setIsAddEventOpen(false)
  }

  const handleEditEvent = (event: ScheduleEvent) => {
    setCurrentEvent(event)
    setNewEvent({
      subject: event.subject,
      startTime: event.startTime,
      endTime: event.endTime,
      paidBy: event.paidBy,
      amount: event.amount,
      url: event.url,
      color: event.color,
    })
    setIsEditMode(true)
    setIsAddEventOpen(true)
  }

  const handleDeleteEvent = (eventId: string) => {
    const updatedEvents = events.filter((event) => event.id !== eventId)
    setEvents(updatedEvents)
    localStorage.setItem(`events_${roomId}_day_${day}`, JSON.stringify(updatedEvents))
    toast({
      title: "Event deleted",
      description: "The event has been removed from your schedule",
    })
  }

  const resetEventForm = () => {
    setNewEvent({
      subject: "",
      startTime: "09:00",
      endTime: "10:00",
      paidBy: "",
      amount: 0,
      url: "",
      color: EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)],
    })
    setCurrentEvent(null)
    setIsEditMode(false)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsAddEventOpen(open)
    if (!open) {
      resetEventForm()
    }
  }

  const goToRoomSettings = () => {
    router.push("/room-settings")
  }

  const navigateToDay = (selectedDay: number) => {
    if (selectedDay < 1 || selectedDay > totalDays) return
    router.push(`/schedule/${selectedDay}`)
  }

  // Handle synchronized scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const timeColumn = document.getElementById("time-column")
    if (timeColumn) {
      timeColumn.scrollTop = e.currentTarget.scrollTop
    }
  }

  // Generate time slots for the schedule (30-minute intervals) - full 24 hours
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const minute = i % 2 === 0 ? "00" : "30"
    return `${hour.toString().padStart(2, "0")}:${minute}`
  })

  // Find events for each time slot
  const getEventsForTimeSlot = (time: string) => {
    return events.filter((event) => {
      // Convert time strings to comparable values (minutes since midnight)
      const [eventStartHour, eventStartMinute] = event.startTime.split(":").map(Number)
      const [eventEndHour, eventEndMinute] = event.endTime.split(":").map(Number)
      const [slotHour, slotMinute] = time.split(":").map(Number)

      const eventStartMinutes = eventStartHour * 60 + eventStartMinute
      const eventEndMinutes = eventEndHour * 60 + eventEndMinute
      const slotMinutes = slotHour * 60 + slotMinute

      return slotMinutes >= eventStartMinutes && slotMinutes < eventEndMinutes
    })
  }

  // Generate days for tabs
  const dayTabs = Array.from({ length: totalDays }, (_, i) => i + 1)

  // Calculate expenses per member
  const calculateExpenses = () => {
    const expenses: Record<string, number> = {}

    // 各メンバーの初期値を 0 に設定
    members.forEach((member) => {
      expenses[member.id] = 0
    })

    // 各イベントに対して処理
    events.forEach((event) => {
      const payerId = event.paidBy
      const totalAmount = event.amount

      if (!payerId || totalAmount <= 0) return

      const numMembers = members.length
      const splitAmount = Math.floor(totalAmount / numMembers) // 切り捨てで均等割

      members.forEach((member) => {
        if (member.id !== payerId) {
          expenses[member.id] += splitAmount
        }
        // 支払った本人（payerId）には加算しない
      })
    })

    return expenses
  }

  const calculateBalances = (
    members: Member[],
    events: ScheduleEvent[]
  ): Record<string, Record<string, number>> => {
    const balances: Record<string, Record<string, number>> = {}
    const memberIds = members.map((m) => m.id)

    // 初期化：各メンバーに対して他メンバーへの支払い額を0で初期化
    memberIds.forEach((id) => {
      balances[id] = {}
      memberIds.forEach((otherId) => {
        if (id !== otherId) balances[id][otherId] = 0
      })
    })

    // イベントごとに支払いを分配
    events.forEach((event) => {
      const { paidBy, amount } = event
      if (!paidBy || amount <= 0) return
      const perPerson = Math.floor(amount / memberIds.length)
      memberIds.forEach((id) => {
        if (id !== paidBy) {
          balances[id][paidBy] += perPerson
        }
      })
    })

    return balances
  }

  const goToToppage = () => {
    localStorage.setItem("currentRoomId", "")
    router.push("/")
  }

  const expenses = calculateExpenses()
  const balances = calculateBalances(members, events)


  return (
    <div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{roomName}</h1>
            <h2 className="text-xl font-semibold text-gray-400">{selectedDate}~</h2>
            <h2 className="text-xl font-semibold text-gray-600">Day {day}</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={goToRoomSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Room Settings
            </Button>
            <Dialog open={isAddEventOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "Edit Event" : "Add New Event"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={newEvent.subject}
                      onChange={(e) => setNewEvent({ ...newEvent, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paidBy">Paid By</Label>
                    <Select
                      value={newEvent.paidBy}
                      onValueChange={(value) => setNewEvent({ ...newEvent, paidBy: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (¥)</Label>
                    <Input
                      id="amount"
                      type="text"
                      inputMode="numeric"
                      value={newEvent.amount}
                      onChange={(e) => {
                        const raw = e.target.value;
                        // 数字以外をすべて除去
                        const digitsOnly = raw.replace(/\D/g, "");
                        // 空なら 0、それ以外は parseInt
                        const amount = digitsOnly === "" ? 0 : parseInt(digitsOnly, 10);
                        setNewEvent(ev => ({ ...ev, amount }));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">URL (Optional)</Label>
                    <Input
                      id="url"
                      value={newEvent.url}
                      onChange={(e) => setNewEvent({ ...newEvent, url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {EVENT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full ${color} ${
                            newEvent.color === color ? "ring-2 ring-offset-2 ring-black" : ""
                          }`}
                          onClick={() => setNewEvent({ ...newEvent, color })}
                        />
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleAddOrUpdateEvent}>
                    {isEditMode ? "Update Event" : "Save Event"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {isDesktop ? (
          <Tabs defaultValue={day.toString()} className="w-full">
            <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(totalDays, 7)}, 1fr)` }}>
              {dayTabs.map((dayNum) => (
                <TabsTrigger key={dayNum} value={dayNum.toString()} onClick={() => navigateToDay(dayNum)}>
                  Day {dayNum}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={day.toString()} className="mt-4">
              <div className="flex h-[60vh] border rounded-md overflow-hidden">
                {/* Wrapper div for synchronized scrolling */}
                <div className="flex w-full">
                  {/* Time column - now in a container with hidden overflow */}
                  <div id="time-column" className="w-[80px] text-xl font-normal bg-gray-50 border-r overflow-hidden">
                    <div className="h-full">
                      {timeSlots.map((time, index) => (
                        <div
                          key={index}
                          id={`time-${time}`}
                          className={`h-12 flex items-start justify-center`}
                        >
                          {index % 2 === 0 && <span>{time.split(":")[0]}:00</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Events column - with onScroll handler */}
                  <div
                    ref={scrollContainerRef}
                    className="w-full bg-white p-2 overflow-y-auto relative"
                    onScroll={handleScroll}
                  >
                    {timeSlots.map((time, index) => {
                      const eventsForSlot = getEventsForTimeSlot(time)
                      return (
                        <div key={index} className={`h-12 relative ${index % 2 === 0 ? "border-t border-gray-200" : ""}`}>
                          {eventsForSlot.map((event) => {
                            // Find the member who paid
                            const payer = members.find((m) => m.id === event.paidBy)?.name || ""
                            // Only render at the start time
                            if (event.startTime === time) {
                              // Calculate duration in 30-minute blocks
                              const [startHour, startMinute] = event.startTime.split(":").map(Number)
                              const [endHour, endMinute] = event.endTime.split(":").map(Number)
                              const startMinutes = startHour * 60 + startMinute
                              const endMinutes = endHour * 60 + endMinute
                              const durationBlocks = Math.ceil((endMinutes - startMinutes) / 30)
                              return (
                                <div
                                  key={event.id}
                                  className={`absolute left-2 right-2 ${event.color} p-2 rounded-md shadow-sm overflow-hidden group`}
                                  style={{ height: `${durationBlocks * 3}rem` }}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="text-lg font-medium">{event.subject}</div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditEvent(event)}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleDeleteEvent(event.id)}
                                          className="text-red-600"
                                        >
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <div className="text-sm">
                                    {event.startTime}〜{event.endTime}
                                  </div>
                                  <div className="relative z-10">
                                    {event.url && <a
                                      className="truncate text-blue-600"
                                      href={event.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {event.url}
                                    </a>}
                                  </div>
                                  <div className="text-sm flex justify-between mt-1 z-10">
                                    <span>支払い：{payer}</span>
                                    {event.amount > 0 && <span>¥{event.amount.toLocaleString()}</span>}
                                  </div>
                                </div>
                              )
                            }
                            return null
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between mb-4">
              <Button variant="outline" disabled={day <= 1} onClick={() => navigateToDay(day - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Day {day - 1}
              </Button>
              <Button variant="outline" disabled={day >= totalDays} onClick={() => navigateToDay(day + 1)}>
                Day {day + 1}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="flex border rounded-md h-[70vh] overflow-hidden">
              {/* Mobile view with synchronized scrolling */}
              <div className="flex w-full">
                {/* Time column */}
                <div id="time-column-mobile" className="w-1/5 md:w-1/3 text-xl font-normal bg-gray-50 border-none overflow-hidden">
                  <div className="h-full">
                    {timeSlots.map((time, index) => (
                      <div
                        key={index}
                        id={`time-mobile-${time}`}
                        className={`h-24 flex items-start justify-center border-none`}
                      >
                        {index % 2 === 0 && <span>{time.split(":")[0]}:00</span>}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Events column */}
                <div
                  ref={scrollContainerRef}
                  className="w-2/3 bg-white p-2 overflow-y-auto relative"
                  onScroll={(e) => {
                    const timeColumn = document.getElementById("time-column-mobile")
                    if (timeColumn) {
                      timeColumn.scrollTop = e.currentTarget.scrollTop
                    }
                  }}
                >
                  {timeSlots.map((time, index) => {
                    const eventsForSlot = getEventsForTimeSlot(time)
                    return (
                      <div key={index} className={`h-24 relative ${index % 2 === 0 ? "border-t border-gray-200" : ""}`}>
                        {eventsForSlot.map((event) => {
                          // Find the member who paid
                          const payer = members.find((m) => m.id === event.paidBy)?.name || ""
                          // Only render at the start time
                          if (event.startTime === time) {
                            // Calculate duration in 30-minute blocks
                            const [startHour, startMinute] = event.startTime.split(":").map(Number)
                            const [endHour, endMinute] = event.endTime.split(":").map(Number)
                            const startMinutes = startHour * 60 + startMinute
                            const endMinutes = endHour * 60 + endMinute
                            const durationBlocks = Math.ceil((endMinutes - startMinutes) / 30)
                            return (
                              <div
                                key={event.id}
                                className={`absolute left-2 right-2 ${event.color} p-2 rounded-md shadow-sm overflow-hidden`}
                                style={{ height: `${durationBlocks * 6}rem` }}
                                onClick={() => handleEditEvent(event)}
                              >
                                <div className="text-xl font-medium">{event.subject}</div>
                                <div>
                                  {event.startTime}〜{event.endTime}
                                </div>
                                <div className="relative z-10">
                                    {event.url && <a
                                      className="truncate text-blue-600"
                                      href={event.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      URL
                                    </a>}
                                  </div>
                                <div className="flex justify-between mt-1 z-10">
                                  <span>支払い：{payer}</span>
                                  {event.amount > 0 && <span>¥{event.amount.toLocaleString()}</span>}
                                </div>
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      
        {/* ✅ Payment Matrix はこの中に含めると自然です */}
        <div className="mt-8 pt-4 border-t">
      <h2 className="text-xl font-semibold mb-4">Expense Summary</h2>
      <PaymentMatrix members={members} balances={balances} />
        </div>
      </div>
        <div className = "flex justify-end pr-2">
          <button onClick={goToToppage} className = "text-gray-100 bg-gray-900 font-normal px-2 py-1 text-lg">Exit ⇒</button>
        </div>
      </div>
    
  )
}
