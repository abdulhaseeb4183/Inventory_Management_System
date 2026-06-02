import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import '../styles/InventoryChart.css';

export default function InventoryChart({ items, variant = 'default' }) {
  if (!items || items.length === 0) {
    return null;
  }

  const embedded = variant === 'embedded';

  const chartBlock = (
    <div className={`inventory-chart-wrapper ${embedded ? 'embedded' : ''}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="var(--text)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="var(--text)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <Tooltip 
            cursor={{ fill: 'var(--border)', opacity: 0.4 }}
            contentStyle={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--border)', 
              color: 'var(--text-h)', 
              borderRadius: '10px',
              boxShadow: 'var(--shadow)'
            }}
          />
          <Bar dataKey="quantity" radius={[6, 6, 0, 0]}>
            {items.map((entry, index) => {
              const isLowStock = entry.quantity < 5;
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={isLowStock ? 'var(--danger, #ef4444)' : 'var(--accent)'} 
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  if (embedded) {
    return (
      <div className="inventory-chart-container embedded">
        {chartBlock}
      </div>
    );
  }

  return (
    <div className="inventory-chart-card">
      <h2 className="inventory-chart-title">
        Stock Availability Overview
      </h2>
      {chartBlock}
    </div>
  );
}