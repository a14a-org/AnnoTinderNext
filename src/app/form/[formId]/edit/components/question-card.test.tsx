import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Reorder } from "framer-motion";
import { QuestionCard } from "./question-card";
import type { Question } from "../types";

// Reorder.Item must be a child of Reorder.Group.
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <Reorder.Group axis="y" values={[]} onReorder={() => {}}>
      {children}
    </Reorder.Group>
  );
}

function renderCard(question: Question, overrides: Partial<Parameters<typeof QuestionCard>[0]> = {}) {
  const onUpdate = vi.fn();
  const onSelect = vi.fn();
  const utils = render(
    <Wrapper>
      <QuestionCard
        question={question}
        index={0}
        isSelected={false}
        onSelect={onSelect}
        onUpdate={onUpdate}
        {...overrides}
      />
    </Wrapper>
  );
  return { onUpdate, onSelect, ...utils };
}

const baseQuestion: Question = {
  id: "q1",
  type: "SHORT_TEXT",
  title: "Original title",
  description: "Original desc",
  placeholder: null,
  isRequired: false,
  displayOrder: 0,
  settings: null,
  options: [],
};

const choiceQuestion: Question = {
  ...baseQuestion,
  id: "q2",
  type: "MULTIPLE_CHOICE",
  title: "Pick one",
  options: [
    { id: "o1", label: "Alpha", value: "Alpha", displayOrder: 0 },
    { id: "o2", label: "Beta", value: "Beta", displayOrder: 1 },
  ],
};

afterEach(() => cleanup());

describe("QuestionCard", () => {
  it("renders title and description from props", () => {
    renderCard(baseQuestion);
    expect(screen.getByDisplayValue("Original title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Original desc")).toBeInTheDocument();
  });

  it("editing the title updates local state and calls onUpdate with new title", () => {
    const { onUpdate } = renderCard(baseQuestion);
    const input = screen.getByPlaceholderText("Question title");
    fireEvent.change(input, { target: { value: "New title" } });
    expect(screen.getByDisplayValue("New title")).toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledWith({ title: "New title" });
  });

  it("editing the description calls onUpdate with new description", () => {
    const { onUpdate } = renderCard(baseQuestion);
    const textarea = screen.getByPlaceholderText("Description (optional)");
    fireEvent.change(textarea, { target: { value: "Updated desc" } });
    expect(screen.getByDisplayValue("Updated desc")).toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledWith({ description: "Updated desc" });
  });

  it("syncs displayed title when the question.title prop changes", () => {
    const { rerender } = renderCard(baseQuestion);
    expect(screen.getByDisplayValue("Original title")).toBeInTheDocument();
    rerender(
      <Wrapper>
        <QuestionCard
          question={{ ...baseQuestion, title: "Externally changed" }}
          index={0}
          isSelected={false}
          onSelect={vi.fn()}
          onUpdate={vi.fn()}
        />
      </Wrapper>
    );
    expect(screen.getByDisplayValue("Externally changed")).toBeInTheDocument();
  });

  it("renders option inputs for choice questions and edits an option", () => {
    const { onUpdate } = renderCard(choiceQuestion);
    expect(screen.getByDisplayValue("Alpha")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Beta")).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("Alpha"), { target: { value: "Gamma" } });
    expect(onUpdate).toHaveBeenCalledWith({
      options: [
        { label: "Gamma", value: "Gamma" },
        { label: "Beta", value: "Beta" },
      ],
    });
  });

  it("adds a new option via the Add option button", () => {
    const { onUpdate } = renderCard(choiceQuestion);
    fireEvent.click(screen.getByText("Add option"));
    const lastCall = onUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall.options).toHaveLength(3);
    expect(lastCall.options[2]).toEqual({ label: "Option 3", value: "Option 3" });
  });

  it("does not render option inputs for non-choice questions", () => {
    renderCard(baseQuestion);
    expect(screen.queryByText("Add option")).not.toBeInTheDocument();
  });

  it("calls onSelect when the card is clicked", () => {
    const { onSelect } = renderCard(baseQuestion);
    fireEvent.click(screen.getByDisplayValue("Original title"));
    // onFocus also fires onSelect; clicking title input triggers focus -> select.
    expect(onSelect).toHaveBeenCalled();
  });
});
