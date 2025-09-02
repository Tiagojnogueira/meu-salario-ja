import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SalaryChartProps {
  grossSalary: number;
  inssDiscount: number;
  irrfDiscount: number;
  netSalary: number;
  alimonyDiscount?: number;
}

export const SalaryChart: React.FC<SalaryChartProps> = ({
  grossSalary,
  inssDiscount,
  irrfDiscount,
  netSalary,
  alimonyDiscount = 0
}) => {
  const data = [
    {
      name: 'Salário Líquido',
      value: netSalary,
      color: 'hsl(var(--success))',
      percentage: ((netSalary / grossSalary) * 100).toFixed(1)
    },
    {
      name: 'Desconto INSS',
      value: inssDiscount,
      color: 'hsl(var(--destructive))',
      percentage: ((inssDiscount / grossSalary) * 100).toFixed(1)
    }
  ];

  if (irrfDiscount > 0) {
    data.push({
      name: 'Desconto IRRF',
      value: irrfDiscount,
      color: 'hsl(220 90% 70%)',
      percentage: ((irrfDiscount / grossSalary) * 100).toFixed(1)
    });
  }

  if (alimonyDiscount > 0) {
    data.push({
      name: 'Pensão Alimentícia',
      value: alimonyDiscount,
      color: 'hsl(280 90% 70%)',
      percentage: ((alimonyDiscount / grossSalary) * 100).toFixed(1)
    });
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-primary">{formatCurrency(data.value)}</p>
          <p className="text-sm text-muted-foreground">{data.percentage}% do salário bruto</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium">{entry.value}</span>
            <span className="text-xs text-muted-foreground">
              ({entry.payload.percentage}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={150}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {data.map((item, index) => (
          <div key={index} className="text-center p-4 rounded-lg bg-muted/30">
            <div 
              className="w-4 h-4 rounded-full mx-auto mb-2" 
              style={{ backgroundColor: item.color }}
            />
            <p className="text-sm font-medium">{item.name}</p>
            <p className="text-lg font-bold" style={{ color: item.color }}>
              {formatCurrency(item.value)}
            </p>
            <p className="text-xs text-muted-foreground">{item.percentage}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};