import { useState, useEffect, useRef } from "react";
import commentService from "../../services/commentService";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import { getUserInitials, getErrorMessage } from "../../utils/helpers";

const CommentSection = ({ taskId }) => {
  const [comments, setComments]     = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading]   = useState(true);
  const [isPosting, setIsPosting]   = useState(false);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(false);

  const { user, canComment } = useAuth();
  const toast                = useToast();
  const bottomRef            = useRef(null);

  const fetchComments = async (pageNum = 1, append = false) => {
    try {
      const res = await commentService.getCommentsByTask(taskId, { page: pageNum, limit: 10 });
      const fetched    = res.data.comments;
      const pagination = res.data.pagination;
      setComments((p) => append ? [...p, ...fetched] : fetched);
      setHasMore(pageNum < pagination.totalPages);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchComments(1); }, [taskId]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchComments(next, true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text) return;
    setIsPosting(true);
    try {
      await commentService.addComment({ taskId, text });
      setNewComment("");
      setPage(1);
      await fetchComments(1);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  if (isLoading) {
    return <p style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>Loading comments…</p>;
  }

  return (
    <div>
      {/* Comment list */}
      {comments.length === 0 ? (
        <p style={{ color: "var(--text-4)", fontSize: "0.82rem", fontStyle: "italic", padding: "0.75rem 0" }}>
          No comments yet.{canComment() && " Be the first to comment."}
        </p>
      ) : (
        <div className="comment-list" style={{ marginBottom: "1rem" }}>
          {comments.map((c) => (
            <div key={c._id} className="comment-item">
              <div className="avatar avatar-sm" style={{ flexShrink: 0, alignSelf: "flex-start", marginTop: "0.15rem" }}>
                {getUserInitials(c.userId?.name)}
              </div>
              <div className="comment-body">
                <div className="comment-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span className="comment-author">{c.userId?.name}</span>
                    {c.userId?._id === user?.id && (
                      <span style={{ fontSize: "0.65rem", background: "var(--accent-surface)", color: "var(--accent-light)", padding: "0.08rem 0.4rem", borderRadius: "99px", fontWeight: 600 }}>You</span>
                    )}
                    <span style={{ fontSize: "0.65rem", background: "var(--bg-4)", color: "var(--text-3)", padding: "0.08rem 0.4rem", borderRadius: "99px" }}>
                      {c.userId?.role?.replace("_", " ")}
                    </span>
                  </div>
                  <span className="comment-date">
                    {new Date(c.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="comment-text">{c.text}</p>
              </div>
            </div>
          ))}
          {hasMore && (
            <div style={{ textAlign: "center" }}>
              <button className="btn btn-secondary btn-sm" onClick={handleLoadMore}>Load older</button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      {canComment() ? (
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <div className="avatar avatar-sm" style={{ flexShrink: 0, marginBottom: "0.1rem" }}>
              {getUserInitials(user?.name)}
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPosting}
                maxLength={500}
                placeholder="Write a comment… (Enter to post)"
                style={{
                  width: "100%",
                  minHeight: 60,
                  padding: "0.55rem 0.8rem",
                  paddingRight: "3rem",
                  background: "var(--bg-4)",
                  border: "1px solid var(--border-bright)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-1)",
                  fontSize: "0.83rem",
                  resize: "vertical",
                  fontFamily: "'DM Sans', sans-serif",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.boxShadow   = "0 0 0 3px var(--accent-glow)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-bright)";
                  e.target.style.boxShadow   = "none";
                }}
              />
              <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: "0.65rem", color: newComment.length > 450 ? "var(--danger)" : "var(--text-4)" }}>
                {newComment.length}/500
              </span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.45rem" }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPosting || !newComment.trim()}>
              {isPosting
                ? <><span className="spinner spinner-sm" style={{ borderTopColor: "white" }} /> Posting…</>
                : "Post ↑"}
            </button>
          </div>
        </form>
      ) : (
        <p style={{ fontSize: "0.8rem", color: "var(--text-4)", fontStyle: "italic" }}>
          Viewers cannot post comments.
        </p>
      )}
    </div>
  );
};

export default CommentSection;