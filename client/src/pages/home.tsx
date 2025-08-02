import React, { useEffect, useState } from "react";

export function Home() {
  const [data, setData] = useState({});

  useEffect(() => {
    fetch("http://localhost:3000/status")
      .then((response) => response.json())
      .then((data) => {
        setData(data);
      });
  }, []);

  return (
    <div>
      <h1>Home Component</h1>
      <p>This is the Home component. This is the data: {data.status}</p>
    </div>
  );
}
