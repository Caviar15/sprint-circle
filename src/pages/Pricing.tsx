import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Zap, Crown, Users, Kanban, Shield } from 'lucide-react'

export default function Pricing() {
  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Zap className="w-4 h-4 mr-1" />
            Simple Pricing
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade when you need more boards and team members.
            No hidden fees, no complicated tiers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Free</CardTitle>
                <Badge variant="outline">Perfect for solo sprints</Badge>
              </div>
              <CardDescription>
                Get started with personal sprint boards
              </CardDescription>
              <div className="text-3xl font-bold">$0</div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>2 sprint boards</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Up to 4 team members per board</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Unlimited private tasks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Real-time collaboration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Sprint capacity tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Email support</span>
                </li>
              </ul>
              <Button className="w-full" asChild>
                <Link to="/login">Start Free</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="shadow-medium border-primary relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-primary text-primary-foreground">
                <Crown className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <Badge variant="outline">For growing teams</Badge>
              </div>
              <CardDescription>
                Scale your sprint planning with unlimited boards
              </CardDescription>
              <div className="text-3xl font-bold">$8<span className="text-lg text-muted-foreground">/month</span></div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-medium">Unlimited sprint boards</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-medium">Unlimited team members</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Advanced sprint analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Priority email support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Export sprint data</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Custom board themes</span>
                </li>
              </ul>
              <Button variant="hero" className="w-full" asChild>
                <Link to="/login">Upgrade to Pro</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-12">Why teams choose SprintWithFriends</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Kanban className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Simple & Focused</h3>
              <p className="text-muted-foreground">
                No overwhelming features. Just what you need for effective 2-week sprints.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Privacy First</h3>
              <p className="text-muted-foreground">
                Mark tasks as private. Share boards with friends while keeping sensitive work secure.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Built for Friends</h3>
              <p className="text-muted-foreground">
                Real-time collaboration designed for small, close-knit teams who want to stay motivated together.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I upgrade or downgrade at any time?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade to Pro anytime. If you downgrade, you'll keep access to Pro features until your billing period ends.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens to my data if I cancel?</h3>
              <p className="text-muted-foreground">
                Your data is always yours. If you cancel Pro, you'll revert to the free plan limits but keep all your existing boards and tasks.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-muted-foreground">
                We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}