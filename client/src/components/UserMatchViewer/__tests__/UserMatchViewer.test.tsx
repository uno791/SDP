import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UserMatchViewer from "../UserMatchViewer";

jest.mock("../UserMatchViewer.module.css", () => new Proxy({}, {
  get: (_, prop: string) => prop,
}));

describe("UserMatchViewer", () => {
  const baseMatch = {
    id: 15,
    status: "full_time",
    minute: 95,
    home_team: { id: 1, name: "Home FC", logo_url: "home.png" },
    away_team: { id: 2, name: "Away FC", logo_url: "away.png" },
    home_score: 2,
    away_score: 1,
  };

  const renderViewer = (props?: Partial<React.ComponentProps<typeof UserMatchViewer>>) => {
    const onClose = jest.fn();
    const result = render(
      <UserMatchViewer
        match={baseMatch}
        events={[]}
        homeSquad={[]}
        awaySquad={[]}
        onClose={onClose}
        {...props}
      />
    );
    return { onClose, ...result };
  };

  it("computes match stats, scorers, and timeline highlights", () => {
    const events = [
      {
        id: 1,
        team_id: 1,
        event_type: "goal",
        player_name: "Home Striker",
        minute: 12,
        detail: "Left footed shot",
      },
      {
        id: 2,
        team_id: 2,
        event_type: "penalty_goal",
        player_name: "Away Striker",
        minute: 41,
      },
      {
        id: 3,
        team_id: 1,
        event_type: "shot_off_target",
        minute: 30,
      },
      {
        id: 4,
        team_id: 2,
        event_type: "shot_on_target",
        minute: 33,
      },
      {
        id: 5,
        team_id: 1,
        event_type: "save",
        minute: 37,
      },
      {
        id: 6,
        team_id: 2,
        event_type: "shot_saved",
        minute: 43,
      },
      {
        id: 7,
        team_id: 2,
        event_type: "foul",
        minute: 50,
        detail: "   ",
      },
      {
        id: 8,
        team_id: 1,
        event_type: "yellow_card",
        minute: 58,
      },
      {
        id: 9,
        team_id: 2,
        event_type: "red_card",
        minute: 63,
      },
      {
        id: 10,
        team_id: 1,
        event_type: "substitution",
        minute: 70,
      },
      {
        id: 11,
        team_id: 2,
        event_type: "shot_off_target",
        minute: 74,
      },
      {
        id: 12,
        team_id: 1,
        event_type: "match_ended",
        minute: 95,
        detail: "Final whistle",
      },
    ];

    renderViewer({
      events,
      homeSquad: ["Home Keeper", "Home Midfielder"],
      awaySquad: ["Away Keeper"],
    });

    expect(screen.getByRole("heading", { name: /Home FC vs Away FC/i })).toBeInTheDocument();
    expect(screen.getByText("User Match Viewer")).toBeInTheDocument();
    expect(screen.getByText("FULL TIME")).toBeInTheDocument();

    expect(screen.getByText("Home Striker 12'")).toBeInTheDocument();
    expect(screen.getByText("Away Striker (p) 41'")).toBeInTheDocument();

    const shotsOnLabel = screen.getByText("Shots on Target");
    expect(shotsOnLabel.previousElementSibling?.textContent).toBe("1");
    expect(shotsOnLabel.nextElementSibling?.textContent).toBe("2");

    const totalShotsLabel = screen.getByText("Total Shots");
    expect(totalShotsLabel.previousElementSibling?.textContent).toBe("2");
    expect(totalShotsLabel.nextElementSibling?.textContent).toBe("3");

    expect(screen.getByText("Shots off Target")).toBeInTheDocument();
    expect(screen.getByText("Shot Accuracy")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(screen.getByText("Fouls committed")).toBeInTheDocument();
    expect(screen.getByText("Yellow cards")).toBeInTheDocument();
    expect(screen.getByText("Red cards")).toBeInTheDocument();
    expect(screen.getByText("Saves")).toBeInTheDocument();
    expect(screen.getByText("Substitutions")).toBeInTheDocument();
    expect(screen.getByText("Shot On Target")).toBeInTheDocument();
    expect(screen.getByText(/Left footed shot/)).toBeInTheDocument();

    const timelineSection = screen
      .getByText("Match Timeline")
      .closest("section") as HTMLElement;
    const timelineItems = within(timelineSection).getAllByRole("listitem");
    expect(timelineItems).toHaveLength(events.length);
    expect(within(timelineItems[0]).getByText("12'")).toBeInTheDocument();
    expect(within(timelineItems[timelineItems.length - 1]).getByText("95'")).toBeInTheDocument();

    expect(screen.getByText("Penalty Goal")).toBeInTheDocument();
    expect(within(timelineItems[0]).getByText("Goal")).toBeInTheDocument();
    expect(screen.getByText("Red Card")).toBeInTheDocument();

    expect(screen.getByText(/Final whistle/)).toBeInTheDocument();
    expect(screen.getByText("Match Ended")).toBeInTheDocument();

    expect(screen.getByText("Home FC Squad")).toBeInTheDocument();
    expect(screen.getByText("Home Keeper")).toBeInTheDocument();
    expect(screen.getByText("Away Keeper")).toBeInTheDocument();
  });

  it("handles in-progress matches without squad info and triggers close action", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    const nowMatch = {
      ...baseMatch,
      status: "in_progress",
      minute: 47,
      home_score: 0,
      away_score: 0,
    };

    render(
      <UserMatchViewer
        match={nowMatch}
        events={[
          {
            id: 20,
            team_id: null,
            event_type: "pause",
            minute: null,
            detail: "Medical break",
          },
        ]}
        homeSquad={[]}
        awaySquad={[]}
        onClose={onClose}
      />
    );

    expect(screen.getByText(/47' LIVE/)).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByText("Pause")).toBeInTheDocument();
    expect(screen.getAllByText("No squad data")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /Close match viewer/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
