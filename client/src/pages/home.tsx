import React, { useEffect, useState } from "react";
import { baseURL } from "../config";
import { useUser } from "../Users/UserContext";
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

  const u= useUser();
  

  return (
    <div>
      <h1>Home Component</h1>
      <p>This is the Home component. /status tells us that: {data.status}</p>
      <p> current user:</p>
      <ul>
        {
          <li >{u.username}</li> // render each name
        }
      </ul>
      
      <p>Usernames From users Table:</p>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user.username}</li> // render each name
        ))}
      </ul>
    </div>
  );
}
