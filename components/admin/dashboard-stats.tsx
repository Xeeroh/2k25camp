import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Church, CheckSquare } from 'lucide-react';

export default function DashboardStats() {
  // Mock data for demo
  const stats = [
    {
      title: "Total de Asistentes",
      value: "216",
      icon: <Users className="h-5 w-5 text-muted-foreground" />,
      change: "+24% respecto al mes pasado",
      changeType: "positive"
    },
    {
      title: "Total Recaudado",
      value: "$75,600",
      icon: <DollarSign className="h-5 w-5 text-muted-foreground" />,
      change: "+12% respecto al mes pasado",
      changeType: "positive"
    },
    {
      title: "Iglesias Participantes",
      value: "42",
      icon: <Church className="h-5 w-5 text-muted-foreground" />,
      change: "+5 nuevas iglesias",
      changeType: "positive"
    },
    {
      title: "Confirmados",
      value: "184",
      icon: <CheckSquare className="h-5 w-5 text-muted-foreground" />,
      change: "85% del total",
      changeType: "neutral"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs ${
              stat.changeType === 'positive' 
                ? 'text-green-600 dark:text-green-400' 
                : stat.changeType === 'negative'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
            }`}>
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}