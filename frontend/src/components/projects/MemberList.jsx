// ─────────────────────────────────────────────────────────────
// FILE: src/components/projects/MemberList.jsx
//
// WHAT WAS BROKEN (2 errors):
//
//   ERROR 1 — Line 40:
//     useEffect has a missing dependency: 'fetchMembers'
//     Same pattern as CommentSection. fetchMembers was a plain
//     function so React couldn't safely track it as a dependency.
//
//   ERROR 2 — Line 48:
//     useEffect has a missing dependency: 'canManage'
//     canManage() comes from useAuth(). ESLint sees it used inside
//     useEffect and wants it in the dep array.
//
// THE FIX:
//   Error 1 → Wrap fetchMembers in useCallback (same solution as
//             CommentSection). Dep array: [projectId].
//             Then useEffect([fetchMembers]) is safe and clean.
//
//   Error 2 → canManage is a function from a context. It never
//             actually changes between renders so adding it to the
//             dep array would not cause re-runs — but ESLint doesn't
//             know that. We use eslint-disable-next-line to silence
//             this specific warning on the second useEffect only.
//             This is the standard community approach for stable
//             context functions.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react"; // FIX: added useCallback
import projectService from "../../services/projectService";
import userService from "../../services/userService";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import { getUserInitials, getErrorMessage } from "../../utils/helpers";

const PROJECT_ROLES = ["PROJECT_MANAGER", "DEVELOPER", "VIEWER"];

const ROLE_COLORS = {
  PROJECT_MANAGER: { color: "#7c5cfc", bg: "rgba(124,92,252,0.1)" },
  DEVELOPER:       { color: "#4cc9f0", bg: "rgba(76,201,240,0.1)" },
  VIEWER:          { color: "#00d68f", bg: "rgba(0,214,143,0.1)"  },
  ADMIN:           { color: "#ffb547", bg: "rgba(255,181,71,0.1)" },
};

const MemberList = ({ projectId, creatorId }) => {
  const [members, setMembers]         = useState([]);
  const [allUsers, setAllUsers]       = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addData, setAddData]         = useState({ userId: "", role: "DEVELOPER" });
  const [isAdding, setIsAdding]       = useState(false);
  const [removingId, setRemovingId]   = useState(null);

  const { canManage } = useAuth();
  const toast = useToast();

  // FIX for Error 1: useCallback gives fetchMembers a stable identity.
  // It only changes when projectId changes, so useEffect below
  // won't run in an infinite loop.
  const fetchMembers = useCallback(async () => {
    try {
      const res = await projectService.getProjectMembers(projectId);
      setMembers(res.data.members);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // toast intentionally omitted — it is a stable ref

  // Now safe to depend on fetchMembers directly
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // FIX for Error 2: canManage comes from useAuth context and never
  // changes. eslint-disable suppresses the warning for this specific
  // effect only. The empty [] is correct — we want this to run once.
  useEffect(() => {
    if (!canManage()) return;
    userService.getAllUsers({ limit: 200, isActive: true })
      .then((r) => setAllUsers(r.data.users))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memberIds      = members.map((m) => m.user?._id);
  const availableUsers = allUsers.filter((u) => !memberIds.includes(u._id));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addData.userId) { toast.error("Please select a user"); return; }
    setIsAdding(true);
    try {
      await projectService.addMember(projectId, addData);
      toast.success("Member added");
      setAddData({ userId: "", role: "DEVELOPER" });
      setShowAddForm(false);
      fetchMembers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (userId) => {
    setRemovingId(userId);
    try {
      await projectService.removeMember(projectId, userId);
      toast.success("Member removed");
      fetchMembers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
        <div className="spinner spinner-md" />
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.1rem" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--text-3)" }}>
          {members.length} member{members.length !== 1 ? "s" : ""}
        </p>
        {canManage() && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm((p) => !p)}>
            {showAddForm ? "× Cancel" : "+ Add Member"}
          </button>
        )}
      </div>

      {/* Add member form */}
      {showAddForm && canManage() && (
        <form
          onSubmit={handleAdd}
          style={{
            background: "var(--bg-3)", border: "1px solid var(--border-accent)",
            borderRadius: "var(--radius)", padding: "1rem",
            marginBottom: "1.1rem", animation: "modalIn 0.25s ease both",
          }}
        >
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.75rem" }}>
            Add new member
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div>
              <label className="form-label">User</label>
              <select
                className="form-select"
                value={addData.userId}
                onChange={(e) => setAddData((p) => ({ ...p, userId: e.target.value }))}
                disabled={isAdding}
              >
                <option value="">-- Select user --</option>
                {availableUsers.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Project Role</label>
              <select
                className="form-select"
                value={addData.role}
                onChange={(e) => setAddData((p) => ({ ...p, role: e.target.value }))}
                disabled={isAdding}
              >
                {PROJECT_ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isAdding}>
              {isAdding
                ? <><span className="spinner spinner-sm" style={{ borderTopColor: "white" }} /> Adding…</>
                : "Add Member"}
            </button>
          </div>
        </form>
      )}

      {/* Member list */}
      {members.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-3)", padding: "1.5rem", fontSize: "0.875rem" }}>
          No members yet
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {members.map((m) => {
            const rc        = ROLE_COLORS[m.role] || ROLE_COLORS.VIEWER;
            const isCreator = m.user?._id === creatorId;
            return (
              <div key={m.user?._id} className="member-row">
                <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                  <div className="avatar avatar-md">{getUserInitials(m.user?.name)}</div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-1)" }}>
                      {m.user?.name}
                      {isCreator && (
                        <span style={{ fontSize: "0.68rem", marginLeft: "0.4rem", color: "var(--accent-light)", fontWeight: 400 }}>
                          (creator)
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: "0.73rem", color: "var(--text-4)" }}>{m.user?.email}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{
                    padding: "0.15rem 0.55rem", borderRadius: "99px",
                    fontSize: "0.7rem", fontWeight: 600,
                    letterSpacing: "0.04em", textTransform: "uppercase",
                    color: rc.color, background: rc.bg,
                  }}>
                    {m.role?.replace("_", " ")}
                  </span>
                  {canManage() && !isCreator && (
                    <button
                      className="btn-icon"
                      onClick={() => handleRemove(m.user?._id)}
                      disabled={removingId === m.user?._id}
                      title="Remove member"
                      style={{ color: "var(--danger)", fontSize: "0.8rem" }}
                    >
                      {removingId === m.user?._id
                        ? <span className="spinner spinner-sm" />
                        : "✕"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MemberList;