import React, { useEffect, useState } from "react";
import { baseURL } from "../config";
export function Home() {
  const [data, setData] = useState({});

  useEffect(() => {
    fetch(`${baseURL}/status`)
      .then((response) => response.json())
      .then((data) => {
        setData(data);
      });
  }, []);

  console.log("baseURL:", baseURL);
  return (
    <div>
      <h1>Home Component</h1>
      <p>This is the Home component. This is the data: {data.status}</p>
    </div>
  );
}
