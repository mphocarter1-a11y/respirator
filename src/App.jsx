import React, { useState, useEffect } from "react";
import {
  Home, Plus, Trash2, Check, Clock, AlertCircle, Activity, BarChart3, Wifi, WifiOff, Loader2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { loadKey, saveKey } from "./storage";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-600 shadow-sm p-4 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-[15px] font-bold text-[#0B2545] tracking-tight mb-3">{children}</h2>;
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
      <Icon size={28} className="mb-2 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function IconBtn({ onClick, children, danger }) {
  return (
    <button onClick={onClick} className={`p-1.5 rounded-lg hover:bg-slate-100 active:scale-95 transition ${danger ? "text-red-500" : "text-slate-400"}`}>
      {children}
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [loaded, setLoaded] = useState(false);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [respirators, setRespirators] = useState([]);
  const [usageLogs, setUsageLogs] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    (async () => {
      const [r, u, m, a] = await Promise.all([
        loadKey("resp-devices", []),
        loadKey("resp-usage", []),
        loadKey("resp-maintenance", []),
        loadKey("resp-alerts", [])
      ]);
      setRespirators(r);
      setUsageLogs(u);
      setMaintenance(m);
      setAlerts(a);
      setLoaded(true);
    })();
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!loaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#EAF2FF]">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#F3F7FE] font-sans text-[#14213D] max-w-md mx-auto relative overflow-hidden">
      <TopBar online={online} />
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {tab === "home" && <HomeTab respirators={respirators} usageLogs={usageLogs} alerts={alerts} setTab={setTab} />}
        {tab === "devices" && <DevicesTab respirators={respirators} setRespirators={r => { setRespirators(r); saveKey("resp-devices", r); }} />}
        {tab === "usage" && <UsageTab usageLogs={usageLogs} setUsageLogs={u => { setUsageLogs(u); saveKey("resp-usage", u); }} respirators={respirators} />}
        {tab === "maintenance" && <MaintenanceTab maintenance={maintenance} setMaintenance={m => { setMaintenance(m); saveKey("resp-maintenance", m); }} />}
        {tab === "alerts" && <AlertsTab alerts={alerts} setAlerts={a => { setAlerts(a); saveKey("resp-alerts", a); }} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

function TopBar({ online }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="bg-[#0B2545] text-white px-4 pt-5 pb-4 flex items-center justify-between max-w-md mx-auto w-full">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-xs">RP</div>
          <span className="font-bold tracking-tight text-[17px]">RespiTrack</span>
        </div>
        <p className="text-[11px] text-blue-200 mt-0.5">{time.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>
      <div className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full ${online ? "bg-blue-500/20 text-blue-200" : "bg-amber-500/20 text-amber-300"}`}>
        {online ? <Wifi size={12} /> : <WifiOff size={12} />}
        {online ? "Online" : "Offline"}
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "devices", label: "Devices", icon: Activity },
    { id: "usage", label: "Usage", icon: Clock },
    { id: "maintenance", label: "Maintenance", icon: BarChart3 },
    { id: "alerts", label: "Alerts", icon: AlertCircle }
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 flex justify-between px-1 py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      {items.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => setTab(id)} className="flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg">
          <Icon size={19} className={tab === id ? "text-blue-600" : "text-slate-400"} strokeWidth={tab === id ? 2.5 : 2} />
          <span className={`text-[10px] font-medium ${tab === id ? "text-blue-600" : "text-slate-400"}`}>{label}</span>
        </button>
      ))}
    </div>
  );
}

function HomeTab({ respirators, usageLogs, alerts, setTab }) {
  const activeDevices = respirators.filter(r => r.active).length;
  const totalHours = usageLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
  const todayHours = usageLogs.filter(l => l.date === todayStr()).reduce((sum, l) => sum + (l.hours || 0), 0);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-white to-[#EAF2FF]">
        <p className="text-xs text-slate-500 font-medium">Active Respirators</p>
        <p className="text-3xl font-black text-[#0B2545] mt-1">{activeDevices}</p>
        <p className="text-xs text-slate-400 mt-0.5">of {respirators.length || 0} devices</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <Clock size={16} className="text-blue-600 mb-1.5" />
          <p className="text-xs text-slate-500">Today</p>
          <p className="text-sm font-semibold">{todayHours}h used</p>
        </Card>
        <Card>
          <Activity size={16} className="text-blue-600 mb-1.5" />
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-sm font-semibold">{totalHours}h total</p>
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="!border-l-red-500 bg-red-50">
          <SectionTitle>⚠️ Active Alerts</SectionTitle>
          <div className="space-y-2">
            {alerts.slice(0, 3).map(a => (
              <p key={a.id} className="text-xs text-red-700">{a.message}</p>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Quick Actions</SectionTitle>
        <div className="flex gap-2">
          <button onClick={() => setTab("devices")} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-xs font-semibold">Add Device</button>
          <button onClick={() => setTab("usage")} className="flex-1 bg-slate-200 text-slate-700 rounded-lg py-2 text-xs font-semibold">Log Usage</button>
        </div>
      </Card>
    </div>
  );
}

function DevicesTab({ respirators, setRespirators }) {
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");

  const add = () => {
    if (!name.trim()) return;
    setRespirators([{ id: uid(), name: name.trim(), model: model.trim(), serial: serial.trim(), active: true, addedOn: todayStr() }, ...respirators]);
    setName(""); setModel(""); setSerial("");
  };

  const toggle = (id) => setRespirators(respirators.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const remove = (id) => setRespirators(respirators.filter(r => r.id !== id));

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Add Respirator</SectionTitle>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Device name (e.g., CPAP-1)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input value={model} onChange={e => setModel(e.target.value)} placeholder="Model" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input value={serial} onChange={e => setSerial(e.target.value)} placeholder="Serial Number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={add} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition">
          <Plus size={16} /> Add Device
        </button>
      </Card>

      <div className="space-y-2">
        {respirators.length === 0 && <EmptyState icon={Activity} text="No devices added yet" />}
        {respirators.map(r => (
          <Card key={r.id} className="flex items-center gap-3">
            <button onClick={() => toggle(r.id)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${r.active ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}>
              {r.active && <Check size={13} className="text-white" />}
            </button>
            <div className="flex-1">
              <p className="text-sm font-medium">{r.name}</p>
              <p className="text-xs text-slate-400">{r.model} • {r.serial}</p>
            </div>
            <IconBtn danger onClick={() => remove(r.id)}><Trash2 size={15} /></IconBtn>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UsageTab({ usageLogs, setUsageLogs, respirators }) {
  const [device, setDevice] = useState("");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");

  const add = () => {
    if (!device || !hours) return;
    setUsageLogs([{ id: uid(), device, hours: Number(hours), date: todayStr(), notes }, ...usageLogs]);
    setDevice(""); setHours(""); setNotes("");
  };

  const remove = (id) => setUsageLogs(usageLogs.filter(l => l.id !== id));
  const chartData = usageLogs.slice(-7).map(l => ({ day: fmtDate(l.date), hours: l.hours }));

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Log Usage</SectionTitle>
        <select value={device} onChange={e => setDevice(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select device</option>
          {respirators.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
        <input value={hours} onChange={e => setHours(e.target.value)} type="number" placeholder="Hours used" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={add} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1.5">
          <Plus size={16} /> Log Usage
        </button>
      </Card>

      <Card>
        <SectionTitle>Past 7 Days</SectionTitle>
        {chartData.length === 0 ? <EmptyState icon={Clock} text="No usage logged yet" /> : (
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#EAF2FF" }} />
                <Bar dataKey="hours" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Recent Logs</SectionTitle>
        <div className="space-y-2">
          {usageLogs.slice(0, 8).map(l => (
            <div key={l.id} className="flex items-center justify-between text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
              <div>
                <p className="font-medium">{l.device}</p>
                <p className="text-xs text-slate-400">{fmtDate(l.date)} • {l.hours}h {l.notes && `• ${l.notes}`}</p>
              </div>
              <IconBtn danger onClick={() => remove(l.id)}><Trash2 size={15} /></IconBtn>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MaintenanceTab({ maintenance, setMaintenance }) {
  const [task, setTask] = useState("");
  const [dueDate, setDueDate] = useState("");

  const add = () => {
    if (!task.trim() || !dueDate) return;
    setMaintenance([{ id: uid(), task: task.trim(), dueDate, done: false }, ...maintenance]);
    setTask(""); setDueDate("");
  };

  const toggle = (id) => setMaintenance(maintenance.map(m => m.id === id ? { ...m, done: !m.done } : m));
  const remove = (id) => setMaintenance(maintenance.filter(m => m.id !== id));

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Schedule Maintenance</SectionTitle>
        <input value={task} onChange={e => setTask(e.target.value)} placeholder="Maintenance task (e.g., Replace filter)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={add} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1.5">
          <Plus size={16} /> Add Task
        </button>
      </Card>

      <div className="space-y-2">
        {maintenance.length === 0 && <EmptyState icon={BarChart3} text="No maintenance tasks scheduled" />}
        {maintenance.map(m => (
          <Card key={m.id} className="flex items-center gap-3">
            <button onClick={() => toggle(m.id)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${m.done ? "bg-green-600 border-green-600" : "border-slate-300"}`}>
              {m.done && <Check size={13} className="text-white" />}
            </button>
            <div className="flex-1">
              <p className={`text-sm font-medium ${m.done ? "line-through text-slate-400" : ""}`}>{m.task}</p>
              <p className="text-xs text-slate-400">{fmtDate(m.dueDate)}</p>
            </div>
            <IconBtn danger onClick={() => remove(m.id)}><Trash2 size={15} /></IconBtn>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AlertsTab({ alerts, setAlerts }) {
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info");

  const add = () => {
    if (!message.trim()) return;
    setAlerts([{ id: uid(), message: message.trim(), severity, createdOn: todayStr(), active: true }, ...alerts]);
    setMessage("");
  };

  const resolve = (id) => setAlerts(alerts.map(a => a.id === id ? { ...a, active: false } : a));
  const remove = (id) => setAlerts(alerts.filter(a => a.id !== id));
  const active = alerts.filter(a => a.active);

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Create Alert</SectionTitle>
        <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Alert message" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2">
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <button onClick={add} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1.5">
          <Plus size={16} /> Add Alert
        </button>
      </Card>

      <div className="space-y-2">
        {active.length === 0 && <EmptyState icon={AlertCircle} text="No active alerts" />}
        {active.map(a => (
          <Card key={a.id} className={`!border-l-${a.severity === "critical" ? "red" : a.severity === "warning" ? "amber" : "blue"}-500`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">{a.message}</p>
                <p className="text-xs text-slate-400 mt-1">{fmtDate(a.createdOn)} • {a.severity}</p>
              </div>
              <div className="flex gap-1">
                <IconBtn onClick={() => resolve(a.id)}><Check size={15} /></IconBtn>
                <IconBtn danger onClick={() => remove(a.id)}><Trash2 size={15} /></IconBtn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle>Resolved</SectionTitle>
        {alerts.filter(a => !a.active).length === 0 ? (
          <p className="text-xs text-slate-400">No resolved alerts</p>
        ) : (
          <div className="space-y-1">
            {alerts.filter(a => !a.active).slice(0, 5).map(a => (
              <p key={a.id} className="text-xs text-slate-500 line-through">{a.message}</p>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
