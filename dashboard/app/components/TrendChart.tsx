"use client"

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function TrendChart({ trendData }: { trendData?: { day: string; flood: number }[] }) {
    if (!trendData) return null;

    return (
        <div className="w-full h-[180px] flex justify-center mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorFlood" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit=" km²" />
                    <Tooltip
                        contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0", fontSize: "12px", boxShadow: "0 0 15px rgba(0, 255, 255, 0.1)" }}
                        itemStyle={{ color: "#22d3ee", fontWeight: "bold" }}
                    />
                    <Area type="monotone" dataKey="flood" name="Water Area" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorFlood)" activeDot={{ r: 6, fill: "#22d3ee", stroke: "#000", strokeWidth: 2 }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
