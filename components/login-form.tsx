"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export function LoginForm() {
  const [roomId, setRoomId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleNewRoom = () => {
    router.push("/room-settings")
  }

  const [LoginIsFailing,setLoginIsFailing] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate checking if room exists
    setTimeout(() => {
      const existingRooms = JSON.parse(localStorage.getItem("travelRooms") || "[]")
      const room = existingRooms.find((r: any) => r.id === roomId && r.password === password)

      if (room) {
        // Set current room
        localStorage.setItem("currentRoomId", roomId)
        router.push("/schedule/1")
        toast({
          title: "Login successful",
          description: `Welcome to ${room.name}`,
        })
      } else {
        toast({
          title: "Login failed",
          description: "Invalid room ID or password",
          variant: "destructive",
        })
        setLoginIsFailing(true)
        setIsLoading(false)
      }
    }, 1000)
  }

  return (
    <>
      <div>{LoginIsFailing ?
            (<div className="fixed top-20 left-1/2 transform -translate-x-1/2 -translate-y-25 text-bold text-red-500 text-center">Login failed because RoomID or Password is different !</div>):("")
        }
      </div>
      <Card className="w-full shadow-lg border-gray-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome</CardTitle>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomId">Room ID</Label>
              <Input
                id="roomId"
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setLoginIsFailing(false)
                }}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleNewRoom}>
              Create New Room
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  )
}
