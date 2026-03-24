import { useState, useEffect, useRef } from "react";

const WG_TYPES = [
  { code: "W", label: "Wonder", color: "#7c3aed", bg: "#ede9fe" },
  { code: "I", label: "Invention", color: "#0369a1", bg: "#e0f2fe" },
  { code: "D", label: "Discernment", color: "#0f766e", bg: "#ccfbf1" },
  { code: "G", label: "Galvanizing", color: "#b45309", bg: "#fef3c7" },
  { code: "E", label: "Enablement", color: "#15803d", bg: "#dcfce7" },
  { code: "T", label: "Tenacity", color: "#b91c1c", bg: "#fee2e2" },
];

const SECTIONS = [
  { id: "lightning", icon: "⚡", title: "Lightning Round", subtitle: "What is everyone working on this week?", duration: 120, type: "per-person" },
  { id: "metrics", icon: "📊", title: "Scorecard Review", subtitle: "Review the scoreboard — are we on track?", duration: 300, type: "shared-notes", placeholder: "Add scorecard notes..." },
  { id: "agenda", icon: "📋", title: "Real-Time Agenda", subtitle: "What topics need to be addressed today?", duration: 300, type: "list", placeholder: "Add an agenda item..." },
  { id: "decisions", icon: "✅", title: "Decisions", subtitle: "Capture decisions made during the meeting", duration: 300, type: "list", placeholder: "Add a decision..." },
  { id: "cascading", icon: "📣", title: "Cascading Messages", subtitle: "What does the team need to communicate downstream?", duration: 300, type: "list", placeholder: "Add a message to cascade..." },
  { id: "actions", icon: "☑️", title: "Action Items", subtitle: "Who is doing what by when?", duration: 300, type: "action-items" },
];
function formatTime(sec) {
  const m = Math.floor(Math.abs(sec) / 60), s = Math.abs(sec) % 60;
  return `${sec < 0 ? "-" : ""}${m}:${s.toString().padStart(2, "0")}`;
}
function formatDuration(s) {
  if (s >= 3600) return `${s / 3600}h`;
  if (s >= 60) return `${s / 60}m`;
  return `${s}s`;
}
function getWG(code) { return WG_TYPES.find((w) => w.code === code); }

function loadStorage(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveStorage(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function pruneHistory(history) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 3);
  return history.filter((m) => new Date(m.date) >= cutoff);
}

function WGBadge({ code, type }) {
  const wg = getWG(code);
  const isGenius = type === "genius";
  const s = isGenius
    ? { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #93c5fd" }
    : { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" };
  return (
    <span title={`${isGenius ? "Genius" : "Frustration"}: ${wg?.label}`}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 4, fontSize: "0.65rem", fontWeight: 700, fontFamily: "'Courier New', monospace", flexShrink: 0, ...s }}>
      {code}
    </span>
  );
}

function MemberBadges({ member }) {
  return (
    <span style={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
      {(member.geniuses || []).map((g) => <WGBadge key={g} code={g} type="genius" />)}
      {(member.frustrations || []).map((f) => <WGBadge key={f} code={f} type="frustration" />)}
    </span>
  );
}
function exportToPDF(meeting, team) {
  const dateStr = new Date(meeting.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const actions = meeting.data.actions || [];
  const decisions = meeting.data.decisions || [];
  const cascading = meeting.data.cascading || [];
  const agenda = meeting.data.agenda || [];
  const displayTeam = team.length > 0 ? team : [{ id: 1, name: "You", geniuses: [], frustrations: [] }];

  const sectionHTML = (icon, title, content) => content ? `
    <div class="section">
      <div class="section-title">${icon} ${title}</div>
      ${content}
    </div>` : "";

  const listHTML = (items) => items.length > 0
    ? `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`
    : `<p class="empty">None recorded.</p>`;

  const actionsHTML = actions.length > 0
    ? `<table><thead><tr><th>Task</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>
        ${actions.map((a) => `<tr><td>${a.task}</td><td>${a.owner || "—"}</td><td>${a.due ? new Date(a.due + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</td><td>${a.done ? "✓ Done" : "Pending"}</td></tr>`).join("")}
       </tbody></table>`
    : `<p class="empty">None recorded.</p>`;

  const lightningHTML = displayTeam.map((m) => {
    const update = meeting.data[`lightning_${m.id}`] || "";
    return `<div class="lightning-row"><strong>${m.name}</strong>${update ? `<span>${update}</span>` : `<span class="empty-inline">No update</span>`}</div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Weekly Tactical — ${dateStr}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a2e; padding: 48px; max-width: 800px; margin: 0 auto; }
  .header { border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 32px; }
  .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-family: 'Courier New', monospace; letter-spacing: 0.12em; margin-bottom: 10px; }
  h1 { font-size: 28px; font-weight: 400; color: #0f172a; margin-bottom: 4px; }
  .date { color: #64748b; font-size: 14px; font-family: 'Courier New', monospace; }
  .team-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .team-chip { background: #f1f5f9; border-radius: 20px; padding: 3px 10px; font-size: 12px; color: #374151; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 15px; font-weight: 700; color: #0f172a; border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Courier New', monospace; }
  p { font-size: 14px; line-height: 1.7; color: #374151; }
  ul { padding-left: 20px; }
  li { font-size: 14px; line-height: 1.8; color: #374151; }
  .empty { color: #94a3b8; font-style: italic; font-size: 13px; }
  .empty-inline { color: #94a3b8; font-style: italic; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; letter-spacing: 0.05em; color: #475569; font-family: 'Courier New', monospace; }
  td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #374151; vertical-align: top; }
  .lightning-row { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f8fafc; font-size: 14px; }
  .lightning-row strong { min-width: 120px; color: #0f172a; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; font-family: 'Courier New', monospace; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="badge">WEEKLY TACTICAL</div>
    <h1>Meeting Summary</h1>
    <div class="date">${dateStr}</div>
    ${team.length > 0 ? `<div class="team-row">${team.map((m) => `<span class="team-chip">${m.name}</span>`).join("")}</div>` : ""}
  </div>
  ${sectionHTML("⚡", "Lightning Round", lightningHTML)}
  ${sectionHTML("📊", "Scorecard Review", meeting.data.metrics ? `<p>${meeting.data.metrics}</p>` : null)}
  ${sectionHTML("📋", "Real-Time Agenda", listHTML(agenda))}
  ${sectionHTML("✅", "Decisions", listHTML(decisions))}
  ${sectionHTML("📣", "Cascading Messages", listHTML(cascading))}
  ${sectionHTML("☑️", "Action Items", actionsHTML)}
  <div class="footer">Generated by Weekly Tactical · ${dateStr}</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}
function MeetingHistory({ history, team, onBack, onView }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Georgia', 'Times New Roman', serif", padding: "2rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "0.875rem", cursor: "pointer", padding: "0 0 1.5rem", fontFamily: "'Georgia', serif", display: "block" }}>← Back to Home</button>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "inline-block", background: "#dbeafe", color: "#1d4ed8", padding: "0.3rem 0.875rem", borderRadius: 4, fontSize: 11, fontFamily: "'Courier New', monospace", letterSpacing: "0.12em", marginBottom: "1rem" }}>MEETING HISTORY</div>
          <h2 style={{ fontSize: "2rem", color: "#0f172a", margin: "0 0 0.4rem", fontWeight: 500 }}>Past Meetings</h2>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>Last 3 months · {history.length} meeting{history.length !== 1 ? "s" : ""} on record</p>
        </div>
        {history.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "3rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📋</div>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No meetings saved yet. Complete your first meeting to see it here.</p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[...history].reverse().map((meeting) => {
            const d = new Date(meeting.date);
            const dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            const actions = meeting.data.actions || [];
            const decisions = meeting.data.decisions || [];
            const pending = actions.filter((a) => !a.done).length;
            return (
              <div key={meeting.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ textAlign: "center", minWidth: 52, background: "#f1f5f9", borderRadius: 10, padding: "0.5rem" }}>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontFamily: "'Courier New', monospace", textTransform: "uppercase" }}>{d.toLocaleDateString("en-US", { month: "short" })}</div>
                  <div style={{ fontSize: "1.4rem", color: "#0f172a", fontWeight: 600, lineHeight: 1.1 }}>{d.getDate()}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#0f172a", fontSize: "0.95rem", fontWeight: 500, marginBottom: 4 }}>Weekly Tactical — {dateStr}</div>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    {decisions.length > 0 && <span style={{ fontSize: "0.75rem", color: "#15803d", background: "#dcfce7", padding: "0.15rem 0.6rem", borderRadius: 20 }}>✅ {decisions.length} decision{decisions.length !== 1 ? "s" : ""}</span>}
                    {actions.length > 0 && <span style={{ fontSize: "0.75rem", color: "#1d4ed8", background: "#dbeafe", padding: "0.15rem 0.6rem", borderRadius: 20 }}>☑️ {actions.length} action{actions.length !== 1 ? "s" : ""}</span>}
                    {pending > 0 && <span style={{ fontSize: "0.75rem", color: "#b45309", background: "#fef3c7", padding: "0.15rem 0.6rem", borderRadius: 20 }}>⏳ {pending} pending</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => exportToPDF(meeting, team)} style={{ background: "transparent", border: "1px solid #e2e8f0", color: "#64748b", padding: "0.45rem 0.875rem", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem", fontFamily: "'Georgia', serif" }}>⬇ PDF</button>
                  <button onClick={() => onView(meeting)} style={{ background: "#0f172a", color: "#fff", border: "none", padding: "0.45rem 0.875rem", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem", fontFamily: "'Georgia', serif" }}>View →</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function MeetingDetail({ meeting, team, onBack }) {
  const dateStr = new Date(meeting.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const displayTeam = team.length > 0 ? team : [{ id: 1, name: "You", geniuses: [], frustrations: [] }];
  const actions = meeting.data.actions || [];
  const decisions = meeting.data.decisions || [];
  const cascading = meeting.data.cascading || [];
  const agenda = meeting.data.agenda || [];

  const SectionBlock = ({ icon, title, children }) => (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.875rem" }}>
        <span style={{ fontSize: "1.1rem" }}>{icon}</span>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", fontFamily: "'Courier New', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>{title}</span>
      </div>
      {children}
    </div>
  );

  const EmptyNote = () => <p style={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic" }}>Nothing recorded.</p>;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Georgia', 'Times New Roman', serif", padding: "2rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "0.875rem", cursor: "pointer", padding: "0 0 1.5rem", fontFamily: "'Georgia', serif", display: "block" }}>← Back to History</button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "inline-block", background: "#dbeafe", color: "#1d4ed8", padding: "0.3rem 0.875rem", borderRadius: 4, fontSize: 11, fontFamily: "'Courier New', monospace", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>MEETING SUMMARY</div>
            <h2 style={{ fontSize: "1.75rem", color: "#0f172a", margin: "0 0 0.25rem", fontWeight: 500 }}>Weekly Tactical</h2>
            <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem", fontFamily: "'Courier New', monospace" }}>{dateStr}</p>
          </div>
          <button onClick={() => exportToPDF(meeting, team)} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "0.7rem 1.4rem", borderRadius: 8, cursor: "pointer", fontSize: "0.875rem", fontFamily: "'Georgia', serif", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            ⬇ Download PDF
          </button>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "2rem" }}>
          <SectionBlock icon="⚡" title="Lightning Round">
            {displayTeam.map((m) => {
              const update = meeting.data[`lightning_${m.id}`];
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", padding: "0.6rem 0", borderBottom: "1px solid #f8fafc" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#dbeafe", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>{m.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: 2 }}>{m.name}</div>
                    <div style={{ fontSize: "0.875rem", color: update ? "#374151" : "#94a3b8", fontStyle: update ? "normal" : "italic" }}>{update || "No update"}</div>
                  </div>
                </div>
              );
            })}
          </SectionBlock>
          <SectionBlock icon="📊" title="Scorecard Review">
            {meeting.data.metrics ? <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.7 }}>{meeting.data.metrics}</p> : <EmptyNote />}
          </SectionBlock>
          <SectionBlock icon="📋" title="Real-Time Agenda">
            {agenda.length > 0 ? <ul style={{ paddingLeft: "1.25rem" }}>{agenda.map((item, i) => <li key={i} style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.8 }}>{item}</li>)}</ul> : <EmptyNote />}
          </SectionBlock>
          <SectionBlock icon="✅" title="Decisions">
            {decisions.length > 0 ? <ul style={{ paddingLeft: "1.25rem" }}>{decisions.map((item, i) => <li key={i} style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.8 }}>{item}</li>)}</ul> : <EmptyNote />}
          </SectionBlock>
          <SectionBlock icon="📣" title="Cascading Messages">
            {cascading.length > 0 ? <ul style={{ paddingLeft: "1.25rem" }}>{cascading.map((item, i) => <li key={i} style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.8 }}>{item}</li>)}</ul> : <EmptyNote />}
          </SectionBlock>
          <SectionBlock icon="☑️" title="Action Items">
            {actions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {actions.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.875rem", background: "#f8fafc", borderRadius: 8, opacity: item.done ? 0.6 : 1 }}>
                    <span style={{ fontSize: "0.9rem", color: item.done ? "#15803d" : "#94a3b8" }}>{item.done ? "✓" : "○"}</span>
                    <span style={{ flex: 1, fontSize: "0.875rem", color: "#374151", textDecoration: item.done ? "line-through" : "none" }}>{item.task}</span>
                    {item.owner && <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "0.15rem 0.6rem", borderRadius: 20, fontSize: "0.72rem" }}>{item.owner}</span>}
                    {item.due && <span style={{ background: "#f1f5f9", color: "#64748b", padding: "0.15rem 0.6rem", borderRadius: 20, fontSize: "0.72rem", fontFamily: "'Courier New', monospace" }}>{new Date(item.due + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                  </div>
                ))}
              </div>
            ) : <EmptyNote />}
          </SectionBlock>
        </div>
      </div>
    </div>
  );
}
Here's chunk 6:
jsxfunction TeamSetup({ team, onSave, onBack }) {
  const [members, setMembers] = useState(team.length > 0 ? team : []);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);

  const addMember = () => {
    if (!newName.trim()) return;
    setMembers((m) => [...m, { id: Date.now(), name: newName.trim(), geniuses: [], frustrations: [] }]);
    setNewName("");
  };
  const removeMember = (id) => { setMembers((m) => m.filter((x) => x.id !== id)); if (editing === id) setEditing(null); };
  const toggleGenius = (id, code) => setMembers((m) => m.map((x) => {
    if (x.id !== id) return x;
    const has = x.geniuses.includes(code);
    if (has) return { ...x, geniuses: x.geniuses.filter((g) => g !== code) };
    if (x.geniuses.length >= 2) return x;
    return { ...x, geniuses: [...x.geniuses, code] };
  }));
  const toggleFrustration = (id, code) => setMembers((m) => m.map((x) => {
    if (x.id !== id) return x;
    const has = x.frustrations.includes(code);
    if (has) return { ...x, frustrations: x.frustrations.filter((f) => f !== code) };
    if (x.frustrations.length >= 2) return x;
    return { ...x, frustrations: [...x.frustrations, code] };
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Georgia', 'Times New Roman', serif", padding: "2rem" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "0.875rem", cursor: "pointer", padding: "0 0 1.5rem", fontFamily: "'Georgia', serif", display: "block" }}>← Back</button>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "inline-block", background: "#dbeafe", color: "#1d4ed8", padding: "0.3rem 0.875rem", borderRadius: 4, fontSize: 11, fontFamily: "'Courier New', monospace", letterSpacing: "0.12em", marginBottom: "1rem" }}>TEAM SETUP</div>
          <h2 style={{ fontSize: "2rem", color: "#0f172a", margin: "0 0 0.5rem", fontWeight: 500 }}>Build Your Team</h2>
          <p style={{ color: "#64748b", margin: 0, lineHeight: 1.6, fontSize: "0.9rem" }}>Add team members and assign their Working Genius types. Your team will be remembered for future meetings.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <input style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.9rem", fontFamily: "'Georgia', serif", color: "#374151", outline: "none", background: "#fff" }}
            placeholder="Add team member name..." value={newName}
            onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMember()} />
          <button onClick={addMember} style={{ background: "#0f172a", color: "#fff", border: "none", padding: "0.75rem 1.25rem", borderRadius: 8, cursor: "pointer", fontSize: "0.875rem", fontFamily: "'Georgia', serif" }}>+ Add</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
          {members.length === 0 && <div style={{ color: "#94a3b8", textAlign: "center", padding: "2rem", fontSize: "0.9rem" }}>No team members yet.</div>}
          {members.map((member) => (
            <div key={member.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "1rem 1.25rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#dbeafe", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, flexShrink: 0 }}>{member.name[0].toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#0f172a", fontSize: "0.95rem", fontWeight: 500 }}>{member.name}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                    <MemberBadges member={member} />
                    {member.geniuses.length === 0 && member.frustrations.length === 0 && <span style={{ color: "#d1d5db", fontSize: "0.75rem", fontStyle: "italic" }}>No WG types set</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setEditing(editing === member.id ? null : member.id)} style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", padding: "0.4rem 0.875rem", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem", fontFamily: "'Georgia', serif" }}>{editing === member.id ? "Done" : "Edit WG"}</button>
                  <button onClick={() => removeMember(member.id)} style={{ background: "transparent", border: "none", color: "#d1d5db", fontSize: "1.25rem", cursor: "pointer", lineHeight: 1, padding: "0 0.25rem" }}>×</button>
                </div>
              </div>
              {editing === member.id && (
                <div style={{ borderTop: "1px solid #f1f5f9", padding: "1rem 1.25rem", background: "#fafafa", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[{ label: "Geniuses", type: "genius", field: "geniuses", dotColor: "#2563eb" }, { label: "Frustrations", type: "frustration", field: "frustrations", dotColor: "#9ca3af" }].map(({ label, type, field, dotColor }) => (
                    <div key={type}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#374151", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.6rem", fontFamily: "'Courier New', monospace", letterSpacing: "0.05em" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, display: "inline-block", flexShrink: 0 }} />
                        {label} <span style={{ color: "#9ca3af", fontWeight: 400 }}>(select 2)</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {WG_TYPES.map((wg) => {
                          const selected = member[field].includes(wg.code);
                          const disabled = !selected && member[field].length >= 2;
                          const isGenius = type === "genius";
                          return (
                            <button key={wg.code} onClick={() => !disabled && (isGenius ? toggleGenius(member.id, wg.code) : toggleFrustration(member.id, wg.code))}
                              style={{ padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.78rem", fontFamily: "'Georgia', serif", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
                                background: selected ? (isGenius ? "#dbeafe" : "#fee2e2") : "#f9fafb",
                                color: selected ? (isGenius ? "#1d4ed8" : "#b91c1c") : "#9ca3af",
                                border: selected ? `2px solid ${isGenius ? "#93c5fd" : "#fca5a5"}` : "2px solid #e5e7eb" }}>
                              <strong>{wg.code}</strong> {wg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {members.length > 0 && <button onClick={() => onSave(members)} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "0.9rem 2rem", borderRadius: 8, fontSize: "1rem", cursor: "pointer", fontFamily: "'Georgia', serif", width: "100%" }}>Save Team & Continue →</button>}
      </div>
    </div>
  );
}
export default function App() {
  const [screen, setScreen] = useState("home");
  const [team, setTeam] = useState(() => loadStorage("wt_team", []));
  const [history, setHistory] = useState(() => pruneHistory(loadStorage("wt_history", [])));
  const [viewingMeeting, setViewingMeeting] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(SECTIONS[0].duration);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sectionData, setSectionData] = useState({});
  const [inputValues, setInputValues] = useState({});
  const [actionInputs, setActionInputs] = useState({});
  const [completedSections, setCompletedSections] = useState(new Set());
  const [meetingDate] = useState(new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
  const intervalRef = useRef(null);

  useEffect(() => {
    if (timerRunning) { intervalRef.current = setInterval(() => setTimerSeconds((s) => s - 1), 1000); }
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  const saveTeam = (members) => { setTeam(members); saveStorage("wt_team", members); setScreen("home"); };
  const goToSection = (i) => { setActiveSection(i); setTimerSeconds(SECTIONS[i].duration); setTimerRunning(false); };

  const getCarryForward = () => {
    if (history.length === 0) return [];
    const last = [...history].reverse()[0];
    return (last.data.actions || []).filter((a) => !a.done).map((a) => ({ ...a, carriedForward: true }));
  };

  const startMeeting = () => {
    const carried = getCarryForward();
    setSectionData(carried.length > 0 ? { actions: carried } : {});
    setCompletedSections(new Set());
    goToSection(0);
    setScreen("meeting");
  };

  const completeMeeting = () => {
    const record = { id: Date.now(), date: new Date().toISOString(), data: sectionData };
    const updated = pruneHistory([...history, record]);
    setHistory(updated);
    saveStorage("wt_history", updated);
    setScreen("home");
  };

  const markComplete = () => {
    setCompletedSections((p) => new Set([...p, activeSection]));
    if (activeSection < SECTIONS.length - 1) goToSection(activeSection + 1);
    else completeMeeting();
  };

  const updateData = (key, val) => setSectionData((p) => ({ ...p, [key]: val }));
  const addListItem = (id, val) => {
    if (!val?.trim()) return;
    setSectionData((p) => ({ ...p, [id]: [...(p[id] || []), val.trim()] }));
    setInputValues((p) => ({ ...p, [id]: "" }));
  };
  const removeListItem = (id, i) => setSectionData((p) => ({ ...p, [id]: p[id].filter((_, idx) => idx !== i) }));
  const addActionItem = () => {
    if (!actionInputs.task?.trim()) return;
    setSectionData((p) => ({ ...p, actions: [...(p.actions || []), { task: actionInputs.task.trim(), owner: actionInputs.owner || "", due: actionInputs.due || "", done: false }] }));
    setActionInputs({});
  };
  const toggleAction = (i) => setSectionData((p) => ({ ...p, actions: p.actions.map((a, idx) => idx === i ? { ...a, done: !a.done } : a) }));

  if (screen === "setup") return <TeamSetup team={team} onSave={saveTeam} onBack={() => setScreen("home")} />;
  if (screen === "history") return <MeetingHistory history={history} team={team} onBack={() => setScreen("home")} onView={(m) => { setViewingMeeting(m); setScreen("detail"); }} />;
  if (screen === "detail") return <MeetingDetail meeting={viewingMeeting} team={team} onBack={() => setScreen("history")} />;

  if (screen === "home") {
    const carried = getCarryForward();
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', 'Times New Roman', serif", position: "relative", overflow: "hidden", padding: "2rem" }}>
        <div style={{ maxWidth: 700, width: "100%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.4)", color: "#60a5fa", padding: "0.35rem 1rem", borderRadius: 4, fontSize: 11, fontFamily: "'Courier New', monospace", letterSpacing: "0.15em", marginBottom: "1.5rem" }}>WEEKLY TACTICAL</div>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "#f8fafc", lineHeight: 1.1, margin: "0 0 1.25rem", fontWeight: 400, letterSpacing: "-0.02em" }}>Run meetings<br />that matter.</h1>
          <p style={{ color: "#94a3b8", fontSize: "1.05rem", lineHeight: 1.7, margin: "0 0 2rem" }}>A structured meeting format based on Patrick Lencioni's<br /><em>Death by Meeting</em> — built for leadership teams.</p>
          {team.length > 0 && (
            <div style={{ background: "#1e293b", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem", border: "1px solid #334155" }}>
              <div style={{ color: "#475569", fontSize: "0.7rem", fontFamily: "'Courier New', monospace", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>YOUR TEAM</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {team.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e3a5f", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>{m.name[0].toUpperCase()}</div>
                    <span style={{ color: "#cbd5e1", fontSize: "0.85rem", width: 100, flexShrink: 0 }}>{m.name}</span>
                    <MemberBadges member={m} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {carried.length > 0 && (
            <div style={{ background: "#1c1a0f", border: "1px solid #b4530944", borderRadius: 12, padding: "0.875rem 1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ color: "#b45309", fontSize: "0.7rem", fontFamily: "'Courier New', monospace", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>⏳ CARRIED FORWARD</div>
              <p style={{ color: "#fbbf24", fontSize: "0.85rem", margin: 0 }}>{carried.length} unfinished action item{carried.length !== 1 ? "s" : ""} from last week will be added to this meeting.</p>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap" }}>
            <button onClick={startMeeting} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "0.9rem 1.75rem", borderRadius: 8, fontSize: "1rem", cursor: "pointer", fontFamily: "'Georgia', serif" }}>Start Weekly Tactical →</button>
            <button onClick={() => setScreen("history")} style={{ background: "transparent", color: "#94a3b8", border: "1px solid #334155", padding: "0.9rem 1.25rem", borderRadius: 8, fontSize: "0.9rem", cursor: "pointer", fontFamily: "'Georgia', serif" }}>
              📋 History {history.length > 0 ? `(${history.length})` : ""}
            </button>
            <button onClick={() => setScreen("setup")} style={{ background: "transparent", color: "#94a3b8", border: "1px solid #334155", padding: "0.9rem 1.25rem", borderRadius: 8, fontSize: "0.9rem", cursor: "pointer", fontFamily: "'Georgia', serif" }}>
              {team.length > 0 ? "✎ Edit Team" : "+ Set Up Team"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", borderLeft: "2px solid #1e3a5f", paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
            {SECTIONS.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.9rem", width: 22 }}>{s.icon}</span>
                <span style={{ color: "#94a3b8", fontSize: "0.85rem", flex: 1 }}>{s.title}</span>
                <span style={{ color: "#334155", fontSize: "0.75rem", fontFamily: "'Courier New', monospace" }}>{formatDuration(s.duration)}</span>
              </div>
            ))}
          </div>
          <p style={{ color: "#1e293b", fontSize: "0.75rem", fontFamily: "'Courier New', monospace" }}>{meetingDate}</p>
        </div>
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      </div>
    );
  }

  const section = SECTIONS[activeSection];
  const isOverTime = timerSeconds < 0;
  const progress = Math.max(0, Math.min(100, ((section.duration - timerSeconds) / section.duration) * 100));
  const displayTeam = team.length > 0 ? team : [{ id: 1, name: "You", geniuses: [], frustrations: [] }];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Georgia', 'Times New Roman', serif", background: "#f8fafc" }}>
      <aside style={{ width: 280, minWidth: 280, background: "#0f172a", display: "flex", flexDirection: "column", padding: "1.5rem 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0 1.5rem 1.5rem", borderBottom: "1px solid #1e293b", marginBottom: "1rem" }}>
          <div style={{ width: 40, height: 40, background: "#2563eb", color: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 700, fontFamily: "'Courier New', monospace", flexShrink: 0 }}>WT</div>
          <div>
            <div style={{ color: "#f1f5f9", fontSize: "0.9rem", fontWeight: 600 }}>Weekly Tactical</div>
            <div style={{ color: "#475569", fontSize: "0.7rem", fontFamily: "'Courier New', monospace", marginTop: 2 }}>{meetingDate}</div>
          </div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.15rem", padding: "0 0.75rem" }}>
          {SECTIONS.map((s, i) => {
            const isActive = i === activeSection, isDone = completedSections.has(i);
            return (
              <button key={s.id} onClick={() => goToSection(i)}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.75rem", borderRadius: 8, border: "none", background: isActive ? "#1e3a5f" : "transparent", cursor: "pointer", textAlign: "left", position: "relative", opacity: isDone ? 0.55 : 1 }}>
                <span style={{ fontSize: "1rem", width: 22, flexShrink: 0 }}>{isDone ? "✓" : s.icon}</span>
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <span style={{ color: "#e2e8f0", fontSize: "0.82rem" }}>{s.title}</span>
                  <span style={{ color: "#475569", fontSize: "0.68rem", fontFamily: "'Courier New', monospace" }}>{formatDuration(s.duration)}</span>
                </div>
                {isActive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", flexShrink: 0 }} />}
              </button>
            );
          })}
        </nav>
        {team.length > 0 && (
          <div style={{ borderTop: "1px solid #1e293b", margin: "1rem 0.75rem 0", padding: "1rem 0.75rem 0" }}>
            <div style={{ color: "#334155", fontSize: "0.65rem", fontFamily: "'Courier New', monospace", letterSpacing: "0.12em", marginBottom: "0.6rem" }}>TEAM</div>
            {team.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", marginBottom: "0.6rem" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1e3a5f", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>{m.name[0].toUpperCase()}</div>
                <div>
                  <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{m.name}</div>
                  <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginTop: 2 }}><MemberBadges member={m} /></div>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setScreen("home")} style={{ margin: "1.5rem 1.5rem 0", background: "transparent", border: "1px solid #1e293b", color: "#475569", padding: "0.6rem", borderRadius: 8, cursor: "pointer", fontSize: "0.8rem", fontFamily: "'Georgia', serif" }}>← End Meeting</button>
      </aside>
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "1.5rem", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "2rem", fontFamily: "'Courier New', monospace", fontWeight: 700, color: isOverTime ? "#ef4444" : "#1a1a2e" }}>{formatTime(timerSeconds)}</span>
            <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{isOverTime ? "Over time" : `of ${formatDuration(section.duration)}`}</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
            <button onClick={() => setTimerRunning((r) => !r)} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "0.5rem 1.25rem", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Georgia', serif" }}>{timerRunning ? "⏸ Pause" : "▶ Start"}</button>
            <button onClick={() => { setTimerSeconds(section.duration); setTimerRunning(false); }} style={{ background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", padding: "0.5rem 1rem", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Georgia', serif" }}>↺ Reset</button>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "#f1f5f9" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: isOverTime ? "#ef4444" : "#2563eb", transition: "width 1s linear", borderRadius: "0 2px 2px 0" }} />
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 860, width: "100%", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div style={{ fontSize: "1.75rem", width: 50, height: 50, background: "#f1f5f9", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{section.icon}</div>
            <div>
              <h2 style={{ fontSize: "1.5rem", color: "#0f172a", margin: "0 0 0.25rem", fontWeight: 600, letterSpacing: "-0.01em" }}>{section.title}</h2>
              <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>{section.subtitle}</p>
            </div>
            <div style={{ marginLeft: "auto", color: "#cbd5e1", fontSize: "0.8rem", fontFamily: "'Courier New', monospace", flexShrink: 0 }}>{activeSection + 1} / {SECTIONS.length}</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "1.5rem", flex: 1 }}>
            {section.type === "per-person" && (
              <div>
                {displayTeam.map((member) => (
                  <div key={member.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#dbeafe", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0 }}>{member.name[0].toUpperCase()}</div>
                    <div style={{ width: 140, flexShrink: 0 }}>
                      <div style={{ color: "#374151", fontSize: "0.85rem", fontWeight: 500, marginBottom: 3 }}>{member.name}</div>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}><MemberBadges member={member} /></div>
                    </div>
                    <input style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.5rem 0.75rem", fontSize: "0.875rem", color: "#374151", fontFamily: "'Georgia', serif", outline: "none", background: "#fafafa" }}
                      placeholder={`${member.name}'s update...`} value={sectionData[`lightning_${member.id}`] || ""} onChange={(e) => updateData(`lightning_${member.id}`, e.target.value)} />
                  </div>
                ))}
              </div>
            )}
            {section.type === "shared-notes" && (
              <textarea style={{ width: "100%", minHeight: 200, border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.875rem", fontSize: "0.9rem", fontFamily: "'Georgia', serif", color: "#374151", resize: "vertical", outline: "none", lineHeight: 1.7, boxSizing: "border-box" }}
                placeholder={section.placeholder} value={sectionData[section.id] || ""} onChange={(e) => updateData(section.id, e.target.value)} />
            )}
            {section.type === "list" && (
              <div>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                  <input style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.6rem 0.875rem", fontSize: "0.875rem", fontFamily: "'Georgia', serif", color: "#374151", outline: "none" }}
                    placeholder={section.placeholder} value={inputValues[section.id] || ""}
                    onChange={(e) => setInputValues((p) => ({ ...p, [section.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addListItem(section.id, inputValues[section.id])} />
                  <button onClick={() => addListItem(section.id, inputValues[section.id])} style={{ background: "#0f172a", color: "#fff", border: "none", padding: "0.6rem 1.1rem", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Georgia', serif" }}>+ Add</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {(sectionData[section.id] || []).map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.875rem", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", flexShrink: 0 }} />
                      <span style={{ color: "#374151", fontSize: "0.9rem", flex: 1 }}>{item}</span>
                      <button onClick={() => removeListItem(section.id, i)} style={{ background: "transparent", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, padding: "0 0.25rem" }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {section.type === "action-items" && (
              <div>
                {(sectionData.actions || []).some((a) => a.carriedForward) && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "0.6rem 0.875rem", marginBottom: "1rem", fontSize: "0.8rem", color: "#92400e" }}>
                    ⏳ Items marked with a dot were carried forward from last week.
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <input style={{ flex: 2, border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.6rem 0.875rem", fontSize: "0.875rem", fontFamily: "'Georgia', serif", color: "#374151", outline: "none" }}
                    placeholder="Action item..." value={actionInputs.task || ""}
                    onChange={(e) => setActionInputs((p) => ({ ...p, task: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addActionItem()} />
                  <select style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.6rem 0.75rem", fontSize: "0.85rem", color: "#374151", background: "#fff", outline: "none", fontFamily: "'Georgia', serif" }}
                    value={actionInputs.owner || ""} onChange={(e) => setActionInputs((p) => ({ ...p, owner: e.target.value }))}>
                    <option value="">Owner</option>
                    {displayTeam.map((m) => <option key={m.id}>{m.name}</option>)}
                  </select>
                  <input type="date" style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.6rem 0.75rem", fontSize: "0.85rem", color: "#374151", fontFamily: "'Georgia', serif", outline: "none" }}
                    value={actionInputs.due || ""} onChange={(e) => setActionInputs((p) => ({ ...p, due: e.target.value }))} />
                  <button onClick={addActionItem} style={{ background: "#0f172a", color: "#fff", border: "none", padding: "0.6rem 1.1rem", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Georgia', serif" }}>+ Add</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {(sectionData.actions || []).map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 0.875rem", background: "#f8fafc", borderRadius: 8, border: `1px solid ${item.carriedForward ? "#fde68a" : "#f1f5f9"}`, opacity: item.done ? 0.5 : 1 }}>
                      <button onClick={() => toggleAction(i)} style={{ width: 22, height: 22, borderRadius: 5, border: "2px solid #cbd5e1", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "#2563eb", flexShrink: 0 }}>{item.done ? "✓" : ""}</button>
                      {item.carriedForward && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} title="Carried forward from last week" />}
                      <span style={{ color: "#374151", fontSize: "0.9rem", flex: 1, textDecoration: item.done ? "line-through" : "none" }}>{item.task}</span>
                      {item.owner && <div style={{ background: "#dbeafe", color: "#1d4ed8", padding: "0.2rem 0.6rem", borderRadius: 20, fontSize: "0.75rem", flexShrink: 0 }}>{item.owner}</div>}
                      {item.due && <div style={{ background: "#f1f5f9", color: "#64748b", padding: "0.2rem 0.6rem", borderRadius: 20, fontSize: "0.75rem", fontFamily: "'Courier New', monospace", flexShrink: 0 }}>{new Date(item.due + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem" }}>
            {activeSection > 0 && <button onClick={() => goToSection(activeSection - 1)} style={{ background: "transparent", border: "1px solid #e2e8f0", color: "#64748b", padding: "0.6rem 1.25rem", borderRadius: 8, cursor: "pointer", fontSize: "0.875rem", fontFamily: "'Georgia', serif" }}>← Previous</button>}
            <button onClick={markComplete} style={{ background: "#0f172a", color: "#fff", border: "none", padding: "0.75rem 1.75rem", borderRadius: 8, cursor: "pointer", fontSize: "0.9rem", fontFamily: "'Georgia', serif", marginLeft: "auto" }}>
              {activeSection === SECTIONS.length - 1 ? "🎉 Complete & Save Meeting" : "Mark Complete →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}           
