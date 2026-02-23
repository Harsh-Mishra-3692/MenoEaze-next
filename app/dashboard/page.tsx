'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import SymptomForm from '@/components/SymptomForm'
import AnalysisCard from '@/components/AnalysisCard'

export default function DashboardPage() {
    const [userId, setUserId] = useState<string | null>(null)
    const [stats, setStats] = useState({
        total: 0,
        avgSeverity: 0,
        lastLogged: '',
        weekly: 0
    })

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserId(data.user.id)
        })
        fetchStats()
    }, [])

    async function fetchStats() {
        const { data } = await supabase
            .from('symptom_logs')
            .select('severity, created_at')
            .eq('is_deleted', false)

        if (!data) return

        const total = data.length
        const avgSeverity =
            total > 0
                ? parseFloat(
                    (data.reduce((a, b) => a + b.severity, 0) / total).toFixed(1)
                )
                : 0

        const lastLogged =
            total > 0
                ? new Date(
                    Math.max(...data.map(d => new Date(d.created_at).getTime()))
                ).toLocaleDateString()
                : '-'

        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        const weekly = data.filter(
            d => new Date(d.created_at) > weekAgo
        ).length

        setStats({ total, avgSeverity, lastLogged, weekly })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100">

            {/* HEADER */}
            <div className="px-10 pt-14 pb-10">
                <h1 className="text-4xl font-bold text-gray-900">
                    Your Health Dashboard
                </h1>
                <p className="text-gray-600 mt-2">
                    Track symptoms. Analyze trends. Improve well-being.
                </p>
            </div>

            {/* STATS */}
            <div className="grid md:grid-cols-4 gap-6 px-10 mb-12">
                <StatCard title="Total Logs" value={stats.total} />
                <StatCard title="Average Severity" value={`${stats.avgSeverity} / 10`} />
                <StatCard title="Last Logged" value={stats.lastLogged} />
                <StatCard title="Logs This Week" value={stats.weekly} />
            </div>

            {/* MAIN CONTENT */}
            <div className="grid lg:grid-cols-2 gap-10 px-10 pb-20">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100">
                    <SymptomForm />
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100">
                    {userId && <AnalysisCard userId={userId} />}
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value }: any) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition">
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">
                {value}
            </p>
        </div>
    )
}