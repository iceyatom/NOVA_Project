"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Page() {
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    setNow(new Date().toLocaleString()); // replaces the old <script> that set #date
  }, []);

  return (
    <main>
      <h1>Niles Biological Starter Page</h1>
      <p>
        Created at: <strong id="date">{now}</strong>
      </p>

      <p>
        This is a basic HTML file to practice version control with Git and
        GitHub.
      </p>
      <button
        id="sayHi"
        onClick={() => alert("Hello! You just clicked the button.")}
      >
        Click Me
      </button>

      <section>
        <h2>Team Member Names</h2>
        <p>Each person can add their name below to practice Github commits:</p>
        <ul>
          <li>
            Name: Jonathan Herman
            <ul>
              <li>Date: 9-28-2025</li>
            </ul>
          </li>
          <li>
            Name: Adam Fedorowicz
            <ul>
              <li>Date: 9-30-2025</li>
            </ul>
          </li>
          <li>
            Name: Mustafa El Attar
            <ul>
              <li>Date: 10-2-2025</li>
            </ul>
          </li>
          <li>
            Name: Alan Kushnir
            <ul>
              <li>Date: 10-1-2025</li>
            </ul>
          </li>
          <li>
            Name: Ronit Narayan
            <ul>
              <li>Date: 10-2-2025</li>
            </ul>
          </li>
          <li>
            Name: Mohamed Ismail
            <ul>
              <li>Date: 10-3-2025</li>
            </ul>
          </li>
          <li>
            Name: Brandon Casey
            <ul>
              <li>Date: 10-4-2025</li>
            </ul>
          </li>
          <li>
            Name: Thomas Nguyen
            <ul>
              <li>Date: 10-5-2025</li>
            </ul>
          </li>
        </ul>
      </section>
    </main>
  );
}
