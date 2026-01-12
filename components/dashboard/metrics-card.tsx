import { Card, CardContent } from "@/components/ui/card"

interface MetricsCardProps {
  label: string
  value: number
  variant?: "default" | "positive" | "negative"
}

export function MetricsCard({ label, value, variant = "default" }: MetricsCardProps) {
  const variants = {
    default: {
      bg: "bg-card border border-border",
      text: "text-foreground",
      label: "text-muted-foreground",
    },
    positive: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-700 dark:text-emerald-400",
      label: "text-emerald-600 dark:text-emerald-500",
    },
    negative: {
      bg: "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800",
      text: "text-red-700 dark:text-red-400",
      label: "text-red-600 dark:text-red-500",
    },
  }

  const style = variants[variant]

  return (
    <Card className={`${style.bg} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <CardContent className="pt-6">
        <p className={`text-xs font-medium tracking-wide mb-3 ${style.label}`}>{label}</p>
        <p className={`text-3xl font-bold tabular-nums ${style.text}`}>{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  )
}
