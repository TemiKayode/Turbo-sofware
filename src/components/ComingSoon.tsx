import { Card, CardContent } from '@/components/ui/card'
import { Clock, Sparkles, Rocket } from 'lucide-react'

interface ComingSoonProps {
  title: string
  description?: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-background to-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
              <div className="w-32 h-32 rounded-full bg-primary/10 blur-xl" />
            </div>
            <div className="relative z-10 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-28 h-28 text-primary/30 animate-pulse" />
              </div>
              <div className="relative bg-primary/10 rounded-full p-6 backdrop-blur-sm">
                <Clock className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Rocket className="w-5 h-5 text-primary animate-bounce" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {title}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground font-medium">
              {description || 'This feature is coming soon'}
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              We're working hard to bring you this functionality. Our team is building something amazing for you. Stay tuned for updates!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

