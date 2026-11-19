import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
)

type Student = {
  id: string | number
  name: string
  email: string
  phone: string
  status: "active" | "inactive"
}

type StatusFilter = "all" | "active" | "inactive"
type StudentStatus = Student["status"]

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  status: "active" as StudentStatus,
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}

function isStatusFilter(value: unknown): value is StatusFilter {
  return value === "all" || value === "active" || value === "inactive"
}

function isStudentStatus(value: unknown): value is StudentStatus {
  return value === "active" || value === "inactive"
}

export function App() {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [students, setStudents] = useState<Student[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("name")

      if (error) {
        console.error(error)
        return
      }
      setStudents((data as Student[]) ?? [])
    }
    load()
  }, [])

  const activeCount = students.filter(
    (student) => student.status === "active"
  ).length
  const inactiveCount = students.length - activeCount

  const visibleStudents = students.filter((student) => {
    const matchesStatus = status === "all" || student.status === status
    const matchesName = student.name
      .toLowerCase()
      .includes(query.trim().toLowerCase())
    return matchesStatus && matchesName
  })

  async function handleAddStudent(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)

    const { data, error } = await supabase
      .from("students")
      .insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: form.status,
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      console.error(error)
      return
    }

    setStudents((current) =>
      [...current, data as Student].sort((a, b) => a.name.localeCompare(b.name))
    )
    setForm(emptyForm)
    setOpen(false)
  }

  return (
    <div className="min-h-svh bg-background p-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-medium">Students</h1>
          <p className="text-sm text-muted-foreground">
            A small roster you can filter by status or name.
          </p>
        </div>

        {/* div for the card */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card size="sm">
            <CardHeader>
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-2xl">{students.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Active</CardDescription>
              <CardTitle className="text-2xl">{activeCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Inactive</CardDescription>
              <CardTitle className="text-2xl">{inactiveCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* end of div for the card */}
        <Separator />

        {/* div for filter and search row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={status}
            onValueChange={(value) => {
              if (isStatusFilter(value)) setStatus(value)
            }}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name"
              aria-label="Search by name"
              className="sm:w-56"
            />
            <Button
              variant="outline"
              onClick={() => setQuery("")}
              disabled={query.length === 0}
            >
              Clear
            </Button>
            <Button onClick={() => setOpen(true)}>Add</Button>
          </div>
        </div>
        {/* end of div for filter and search row */}

        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen)
            if (!nextOpen) setForm(emptyForm)
          }}
        >
          <DialogContent>
            <form onSubmit={handleAddStudent} className="grid gap-6">
              <DialogHeader>
                <DialogTitle>Add student</DialogTitle>
                <DialogDescription>
                  Enter the student details, then save to add them to the
                  roster.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) => {
                      if (isStudentStatus(value)) {
                        setForm((current) => ({ ...current, status: value }))
                      }
                    }}
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="inactive">inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* table but no separate div */}
        {visibleStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No students match those filters.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback>
                          {initials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      {student.name}
                    </div>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        student.status === "active" ? "default" : "secondary"
                      }
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {/* end of table conditional*/}
      </div>
    </div>
  )
}

export default App
