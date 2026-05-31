import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Play } from "lucide-react";
import { SpecialScreenCard } from "./special-screen-card";
import type { Question } from "../types";

const screenQuestion: Question = {
  id: "w1",
  type: "WELCOME_SCREEN",
  title: "Welcome!",
  description: "Intro text",
  placeholder: null,
  isRequired: false,
  displayOrder: 0,
  settings: null,
  options: [],
};

function renderScreen(question: Question, overrides = {}) {
  const onUpdate = vi.fn();
  const onSelect = vi.fn();
  const utils = render(
    <SpecialScreenCard
      question={question}
      icon={Play}
      label="Welcome Screen"
      isSelected={false}
      onSelect={onSelect}
      onUpdate={onUpdate}
      {...overrides}
    />
  );
  return { onUpdate, onSelect, ...utils };
}

afterEach(() => cleanup());

describe("SpecialScreenCard", () => {
  it("renders title and description from props plus the label", () => {
    renderScreen(screenQuestion);
    expect(screen.getByDisplayValue("Welcome!")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Intro text")).toBeInTheDocument();
    expect(screen.getByText("Welcome Screen")).toBeInTheDocument();
  });

  it("editing the title updates local state and calls onUpdate", () => {
    const { onUpdate } = renderScreen(screenQuestion);
    fireEvent.change(screen.getByPlaceholderText("Screen Title"), {
      target: { value: "New welcome" },
    });
    expect(screen.getByDisplayValue("New welcome")).toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledWith({ title: "New welcome" });
  });

  it("editing the description calls onUpdate", () => {
    const { onUpdate } = renderScreen(screenQuestion);
    fireEvent.change(screen.getByPlaceholderText("Description (optional)"), {
      target: { value: "New intro" },
    });
    expect(onUpdate).toHaveBeenCalledWith({ description: "New intro" });
  });

  it("syncs displayed values when props change externally", () => {
    const { rerender } = renderScreen(screenQuestion);
    rerender(
      <SpecialScreenCard
        question={{ ...screenQuestion, title: "Changed", description: "Changed desc" }}
        icon={Play}
        label="Welcome Screen"
        isSelected={false}
        onSelect={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue("Changed")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Changed desc")).toBeInTheDocument();
  });

  it("calls onSelect when the card is clicked", () => {
    const { onSelect } = renderScreen(screenQuestion);
    fireEvent.click(screen.getByText("Welcome Screen"));
    expect(onSelect).toHaveBeenCalled();
  });

  it("renders empty description gracefully when null", () => {
    renderScreen({ ...screenQuestion, description: null });
    const textarea = screen.getByPlaceholderText("Description (optional)");
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });
});
