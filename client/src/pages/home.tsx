import React, { useEffect, useState } from "react";
import { baseURL } from "../config";
export function Home() {
  const [data, setData] = useState({});
  const [users, setUsers] = useState<{ username: string }[]>([]);
  useEffect(() => {
    fetch(`${baseURL}/status`)
      .then((response) => response.json())
      .then((data) => {
        setData(data);
      });
  }, []);

  useEffect(() => {
    fetch(`${baseURL}/names`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
      })
      .catch((err) => {
        console.error("Failed to fetch users:", err);
      });
  }, []);

  return (
    <div>
      <h1>Home Component</h1>
      <p>This is the Home component. /status tells us that: {data.status}</p>
      <p>Usernames From users Table:</p>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user.username}</li> // render each name
        ))}
      </ul>
    </div>
  );
}
