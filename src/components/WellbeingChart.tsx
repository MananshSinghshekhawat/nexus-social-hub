import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserWellbeingData } from "@/lib/wellbeingApi";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Zap, AlertCircle } from "lucide-react";

interface WellbeingChartProps {
  data: Pick<UserWellbeingData, "today" | "week" | "month" | "stats">;
}

// SVG Gradient definitions
const GradientDefs = () => (
  <defs>
    <linearGradient id="blueToPurple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#3b82f6" />
      <stop offset="100%" stopColor="#8b5cf6" />
    </linearGradient>
    <linearGradient id="emeraldToTeal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#10b981" />
      <stop offset="100%" stopColor="#06b6d4" />
    </linearGradient>
    <linearGradient id="roseToPink" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#ef4444" />
      <stop offset="100%" stopColor="#ec4899" />
    </linearGradient>
  </defs>
);

// Custom glassmorphism tooltip
interface TooltipPayload {
  name?: string;
  value?: number;
  payload?: {
    day?: string;
    prevValue?: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const prevData = payload[0]?.payload?.prevValue || data.value;
    const trend = data.value >= prevData ? "up" : "down";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-white/20 bg-black/40 backdrop-blur-md px-4 py-2 shadow-lg"
      >
        <p className="text-sm font-semibold text-white">{data.name || data.payload?.day}</p>
        <p className="text-lg font-bold text-blue-400">{data.value}</p>
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" ? (
            <TrendingUp className="h-3 w-3 text-emerald-400" />
          ) : (
            <TrendingDown className="h-3 w-3 text-rose-400" />
          )}
          <span className="text-xs text-gray-300">
            {Math.abs((((data.value - prevData) / prevData) * 100)).toFixed(0)}%
          </span>
        </div>
      </motion.div>
    );
  }
  return null;
};

export const WellbeingChart = ({ data }: WellbeingChartProps) => {
  // Prepare data for activity breakdown
  const todayBreakdownData = Object.entries(data.today.breakdown)
    .map(([activity, count]) => ({
      name: activity.charAt(0).toUpperCase() + activity.slice(1),
      value: count ?? 0,
    }))
    .filter((item) => item.value > 0);

  const weekBreakdownData = Object.entries(data.week.breakdown)
    .map(([activity, count]) => ({
      name: activity.charAt(0).toUpperCase() + activity.slice(1),
      value: count ?? 0,
    }))
    .filter((item) => item.value > 0);

  // Weekly trend with previous values for trend calculation
  const weeklyAvg = Math.round(data.week.activities / 7);
  const trendData = [
    { day: "Mon", activities: Math.round((data.week.activities / 7) * 0.8), prevValue: 10 },
    { day: "Tue", activities: Math.round((data.week.activities / 7) * 0.9), prevValue: 12 },
    { day: "Wed", activities: Math.round((data.week.activities / 7) * 1.1), prevValue: 15 },
    { day: "Thu", activities: Math.round((data.week.activities / 7) * 0.95), prevValue: 14 },
    { day: "Fri", activities: Math.round((data.week.activities / 7) * 1.2), prevValue: 16 },
    { day: "Sat", activities: Math.round((data.week.activities / 7) * 1.05), prevValue: 13 },
    { day: "Sun", activities: Math.round((data.week.activities / 7) * 0.85), prevValue: 11 },
  ];

  // Hourly heatmap data (simulated)
  const heatmapData = [
    { hour: "12am", activities: 0 },
    { hour: "1am", activities: 1 },
    { hour: "2am", activities: 0 },
    { hour: "3am", activities: 0 },
    { hour: "4am", activities: 0 },
    { hour: "5am", activities: 2 },
    { hour: "6am", activities: 3 },
    { hour: "7am", activities: 8 },
    { hour: "8am", activities: 15 },
    { hour: "9am", activities: 22 },
    { hour: "10am", activities: 18 },
    { hour: "11am", activities: 12 },
    { hour: "12pm", activities: 14 },
    { hour: "1pm", activities: 16 },
    { hour: "2pm", activities: 19 },
    { hour: "3pm", activities: 17 },
    { hour: "4pm", activities: 20 },
    { hour: "5pm", activities: 18 },
    { hour: "6pm", activities: 12 },
    { hour: "7pm", activities: 10 },
    { hour: "8pm", activities: 8 },
    { hour: "9pm", activities: 6 },
    { hour: "10pm", activities: 4 },
    { hour: "11pm", activities: 2 },
  ];

  // Daily wellbeing goal progress (simulated as 70% of a goal of 30 activities)
  const dailyGoal = 30;
  const progressPercent = (data.today.activities / dailyGoal) * 100;
  const progressData = [
    {
      name: "Progress",
      value: Math.min(progressPercent, 100),
      fill: "url(#blueToPurple)",
    },
  ];

  // AI Insight generator
  const generateInsight = () => {
    const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const comparison = data.today.activities > weeklyAvg ? "above" : "below";
    const percentage = Math.abs(
      (((data.today.activities - weeklyAvg) / weeklyAvg) * 100)
    ).toFixed(0);

    if (comparison === "above") {
      return `You're ${percentage}% more active today than your usual ${dayOfWeek}—remember to take a 'Quiet Mode' break to maintain balance!`;
    } else {
      return `You're ${percentage}% less active than usual. Take some time to engage with your community or focus on what matters to you today.`;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* AI Insight Card */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="currentColor" />
              </pattern>
              <rect width="100" height="100" fill="url(#pattern)" />
            </svg>
          </div>
          <CardHeader className="relative pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-base">AI Insight</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-sm leading-relaxed text-foreground/80">{generateInsight()}</p>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  {data.today.activities}
                </div>
                <p className="text-xs text-muted-foreground mt-1">activities</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                  {data.week.activities}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.week.average_daily || 0}/day avg
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-rose-500/10 to-rose-500/5 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Login Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent">
                  {data.stats.login_streak}
                </div>
                <p className="text-xs text-muted-foreground mt-1">days</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  {data.stats.total_activities}
                </div>
                <p className="text-xs text-muted-foreground mt-1">all time</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Daily Goal Progress Ring */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 bg-gradient-to-br from-slate-500/10 to-slate-500/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Daily Wellbeing Goal</CardTitle>
                <CardDescription>Progress towards today's activity target</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-8">
                  <ResponsiveContainer width={200} height={200}>
                    <RadialBarChart
                      data={progressData}
                      innerRadius="70%"
                      outerRadius="100%"
                      startAngle={180}
                      endAngle={0}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <RadialBar
                        dataKey="value"
                        fill="url(#blueToPurple)"
                        cornerRadius={10}
                        label={{ position: "center" }}
                      />
                      <GradientDefs />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Current</p>
                      <p className="text-2xl font-bold">{data.today.activities}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Goal</p>
                      <p className="text-2xl font-bold">{dailyGoal}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="text-2xl font-bold text-blue-500">
                        {Math.min(progressPercent, 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* BREAKDOWN TAB */}
        <TabsContent value="breakdown" className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="border-0 bg-gradient-to-br from-slate-500/10 to-slate-500/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Today's Activity Breakdown</CardTitle>
                <CardDescription>Distribution of your activities today</CardDescription>
              </CardHeader>
              <CardContent>
                {todayBreakdownData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={todayBreakdownData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        animationDuration={800}
                      >
                        {todayBreakdownData.map((_, index) => {
                          const gradients = [
                            "url(#blueToPurple)",
                            "url(#emeraldToTeal)",
                            "url(#roseToPink)",
                          ];
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={gradients[index % gradients.length]}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <GradientDefs />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No activities yet today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 bg-gradient-to-br from-slate-500/10 to-slate-500/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Weekly Activity Breakdown</CardTitle>
                <CardDescription>Your activity types this week</CardDescription>
              </CardHeader>
              <CardContent>
                {weekBreakdownData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weekBreakdownData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        fill="url(#barGradient)"
                        radius={[8, 8, 0, 0]}
                        animationDuration={800}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No activities this week</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* TRENDS TAB */}
        <TabsContent value="trends" className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="border-0 bg-gradient-to-br from-slate-500/10 to-slate-500/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Weekly Activity Trend</CardTitle>
                <CardDescription>Your activity pattern with weekly average benchmark</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" stroke="transparent" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={weeklyAvg}
                      stroke="#8b5cf6"
                      strokeDasharray="5 5"
                      label={{
                        value: `Weekly Avg: ${weeklyAvg}`,
                        position: "insideTopRight",
                        offset: -10,
                        fill: "#a78bfa",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="activities"
                      stroke="url(#lineGradient)"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", r: 5 }}
                      activeDot={{ r: 7 }}
                      animationDuration={800}
                      isAnimationActive
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* HEATMAP TAB - NEW */}
        <TabsContent value="heatmap" className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="border-0 bg-gradient-to-br from-slate-500/10 to-slate-500/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Focus Heatmap</CardTitle>
                <CardDescription>Your activity intensity by hour of day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart
                    data={heatmapData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                  >
                    <defs>
                      <linearGradient id="heatGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" stroke="transparent" />
                    <XAxis
                      dataKey="hour"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      axisLine={false}
                      tickLine={false}
                      interval={1}
                    />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="activities"
                      fill="url(#heatGradient)"
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-sm text-muted-foreground">
                    📊 <strong>Peak Hours:</strong> Most active between 2-5 PM. Consider scheduling important tasks during this window.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
