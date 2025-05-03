import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Travel Planner</h1>
          <p className="mt-2 text-gray-600">Plan your trips together</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
