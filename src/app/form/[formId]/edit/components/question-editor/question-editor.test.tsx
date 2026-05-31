import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { QuestionEditor } from "./index";
import type { Question } from "../../types";

const baseQuestion: Question = {
  id: "q1",
  type: "SHORT_TEXT",
  title: "Question title",
  description: "Desc",
  placeholder: "ph",
  isRequired: false,
  displayOrder: 0,
  settings: null,
  options: [],
};

const choiceQuestion: Question = {
  ...baseQuestion,
  id: "q2",
  type: "MULTIPLE_CHOICE",
  options: [
    { id: "o1", label: "Alpha", value: "Alpha", displayOrder: 0 },
    { id: "o2", label: "Beta", value: "Beta", displayOrder: 1 },
  ],
};

function renderEditor(question: Question, overrides = {}) {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const utils = render(
    <QuestionEditor question={question} onUpdate={onUpdate} onDelete={onDelete} {...overrides} />
  );
  return { onUpdate, onDelete, ...utils };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  cleanup();
});

describe("QuestionEditor", () => {
  it("renders the standard editor with title, description and placeholder", () => {
    renderEditor(baseQuestion);
    expect(screen.getByDisplayValue("Question title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Desc")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ph")).toBeInTheDocument();
  });

  it("editing title triggers onUpdate with the full payload including new title", () => {
    const { onUpdate } = renderEditor(baseQuestion);
    fireEvent.change(screen.getByDisplayValue("Question title"), {
      target: { value: "Changed" },
    });
    const lastCall = onUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall.title).toBe("Changed");
    expect(lastCall.description).toBe("Desc");
    expect(lastCall.isRequired).toBe(false);
  });

  it("shows Saving... then Saved status after an edit", () => {
    renderEditor(baseQuestion);
    fireEvent.change(screen.getByDisplayValue("Question title"), {
      target: { value: "X" },
    });
    expect(screen.getByText("Saving...")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("toggling Required propagates isRequired=true", () => {
    const { onUpdate } = renderEditor(baseQuestion);
    fireEvent.click(screen.getByLabelText("Required"));
    const lastCall = onUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall.isRequired).toBe(true);
  });

  it("syncs title from props when the title input is NOT focused", () => {
    const { rerender } = renderEditor(baseQuestion);
    rerender(
      <QuestionEditor
        question={{ ...baseQuestion, title: "From server" }}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue("From server")).toBeInTheDocument();
  });

  it("does NOT overwrite the title from props while the title input is focused", () => {
    const { rerender } = renderEditor(baseQuestion);
    const input = screen.getByDisplayValue("Question title");
    act(() => {
      (input as HTMLInputElement).focus();
    });
    rerender(
      <QuestionEditor
        question={{ ...baseQuestion, title: "Should-not-apply" }}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    // Focused input keeps the user's in-progress value, not the incoming prop.
    expect(screen.getByDisplayValue("Question title")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Should-not-apply")).not.toBeInTheDocument();
  });

  it("renders choice options and edits an option label", () => {
    const { onUpdate } = renderEditor(choiceQuestion);
    expect(screen.getByDisplayValue("Alpha")).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("Alpha"), { target: { value: "Gamma" } });
    const lastCall = onUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall.options).toEqual([
      { label: "Gamma", value: "Gamma" },
      { label: "Beta", value: "Beta" },
    ]);
  });

  it("adds and removes options", () => {
    const { onUpdate } = renderEditor(choiceQuestion);
    fireEvent.click(screen.getByText("+ Add option"));
    let lastCall = onUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall.options).toHaveLength(3);

    // Remove the first option (two trash buttons exist per option row).
    const removeButtons = screen.getAllByRole("button").filter((b) =>
      b.querySelector("svg")
    );
    // The first option's delete button removes "Alpha".
    fireEvent.click(removeButtons[1]);
    lastCall = onUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall.options.find((o: { label: string }) => o.label === "Alpha")).toBeUndefined();
  });

  it("renders the Text Annotation editor variant with its title field", () => {
    renderEditor({ ...baseQuestion, type: "TEXT_ANNOTATION" });
    expect(screen.getByText("Edit Annotation")).toBeInTheDocument();
  });

  it("renders the Informed Consent editor variant", () => {
    renderEditor({ ...baseQuestion, type: "INFORMED_CONSENT" });
    expect(screen.getByText("Edit Informed Consent")).toBeInTheDocument();
  });
});
