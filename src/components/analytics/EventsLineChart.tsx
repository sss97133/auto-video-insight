
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";

interface EventsLineChartProps {
  data: any[];
}

const EventsLineChart = ({ data }: EventsLineChartProps) => {
  // Process data to group by date and event type
  const processedData = data.reduce((acc: any[], event) => {
    const date = format(new Date(event.timestamp), 'MMM dd');
    const existingEntry = acc.find(item => item.date === date);

    if (existingEntry) {
      existingEntry[event.event_type] = (existingEntry[event.event_type] || 0) + 1;
    } else {
      const newEntry = { date };
      newEntry[event.event_type] = 1;
      acc.push(newEntry);
    }

    return acc;
  }, []);

  const eventTypes = Array.from(new Set(data.map(event => event.event_type)));
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {eventTypes.map((type, index) => (
            <Line
              key={type}
              type="monotone"
              dataKey={type}
              stroke={colors[index % colors.length]}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EventsLineChart;
