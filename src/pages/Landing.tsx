import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Users, Zap, Shield, Kanban, Calendar, Target } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-surface">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            <Zap className="w-4 h-4 mr-1" />
            Sprint Planning Made Simple
          </Badge>
          
          <h1 className="text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent leading-tight">
            Sprints with Friends
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Simple, private, and motivating Kanban boards for your 2-week sprints. 
            Collaborate with friends while keeping your private tasks secure.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="hero" size="xl" asChild>
              <Link to="/login">Start Your First Sprint</Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="shadow-soft hover:shadow-medium transition-smooth">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Kanban className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Simple Kanban</h3>
                <p className="text-muted-foreground">
                  Backlog → To Do → In Progress → Done. 
                  Clean, focused workflow for 2-week sprints.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-smooth">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Private Tasks</h3>
                <p className="text-muted-foreground">
                  Mark tasks as private. Only you and the board owner can see the details.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-smooth">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Collaborate</h3>
                <p className="text-muted-foreground">
                  Invite friends to boards. Real-time updates. 
                  Multiple boards for different groups.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need for productive sprints</h2>
            <p className="text-lg text-muted-foreground">
              Built for small teams who want to stay motivated and organized
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Smart Sprint Planning</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium">Sprint Capacity Tracking</p>
                    <p className="text-sm text-muted-foreground">Set your 2-week capacity and track committed vs remaining points</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium">Drag & Drop Simplicity</p>
                    <p className="text-sm text-muted-foreground">Move tasks between lanes with smooth, responsive interactions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium">Real-time Collaboration</p>
                    <p className="text-sm text-muted-foreground">See changes instantly as your team updates tasks</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-medium">
              {/* Mock Kanban Board Preview */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Team Sprint Board</h4>
                  <Badge variant="outline">Sprint 1</Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-background p-2 rounded">
                    <div className="text-center font-medium mb-1 text-warning">Backlog</div>
                    <div className="space-y-1">
                      <div className="bg-card border rounded p-1">Task 1</div>
                      <div className="bg-card border rounded p-1">Task 2</div>
                    </div>
                  </div>
                  <div className="bg-background p-2 rounded">
                    <div className="text-center font-medium mb-1 text-primary">To Do</div>
                    <div className="space-y-1">
                      <div className="bg-card border rounded p-1">Task 3</div>
                    </div>
                  </div>
                  <div className="bg-background p-2 rounded">
                    <div className="text-center font-medium mb-1 text-lane-progress">In Progress</div>
                    <div className="space-y-1">
                      <div className="bg-card border rounded p-1">Task 4</div>
                    </div>
                  </div>
                  <div className="bg-background p-2 rounded">
                    <div className="text-center font-medium mb-1 text-success">Done</div>
                    <div className="space-y-1">
                      <div className="bg-card border rounded p-1">Task 5</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-surface">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start your first sprint?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of teams already using SprintWithFriends to stay organized and motivated.
          </p>
          <Button variant="hero" size="xl" asChild>
            <Link to="/login">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}