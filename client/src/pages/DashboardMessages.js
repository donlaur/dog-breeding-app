import React, { useEffect, useState } from 'react';
import { API_URL, debugLog, debugError } from "../config";
import { apiGet } from "../utils/apiUtils";

function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        debugLog("Fetching admin messages...");
        const response = await apiGet('dashboard/messages');
        
        if (response.ok) {
          debugLog("Messages received:", response.data);
          setMessages(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch messages");
        }
      } catch (err) {
        debugError("Error fetching messages:", err);
        debugError("Error details:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, []);

  if (loading) return <p className="text-center mt-4">Loading messages...</p>;
  if (error) return <p className="alert alert-danger">{error}</p>;

  return (
    <div className="container mt-4">
      <h1 className="text-center"><i className="fas fa-inbox"></i> Admin Messages</h1>
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Message</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(msg => (
              <tr key={msg.id}>
                <td>{msg.id}</td>
                <td>{msg.name}</td>
                <td>{msg.email}</td>
                <td>{msg.message}</td>
                <td>{msg.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminMessages;
