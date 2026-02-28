"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

export default function TrendChart({ trendData }: { trendData?: { day: string; flood: number }[] }) {
    if (!trendData) return null;

    return (
        <div className="w-full h-[150px] flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                    <XAxis dataKey="day" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: "#0b1220", border: "1px solid #1f2937" }} />
                    <Line type="monotone" dataKey="flood" stroke="#00f5ff" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
