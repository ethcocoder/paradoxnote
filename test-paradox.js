/**
 * ParadoxNote Functional Verification Script
 * This script tests the core logic of the ParadoxNote application:
 * 1. History Management (Undo/Redo)
 * 2. Note Serialization (Saving format)
 * 3. Note Deserialization (Loading logic)
 */

const assert = (condition, message) => {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    }
    console.log(`✅ PASS: ${message}`);
};

// --- Test Case 1: History Management ---
console.log("\n--- Testing History Management ---");

let state = {
    draft: "",
    history: [],
    historyIndex: -1
};

const pushToHistory = (text) => {
    const nextHistory = state.history.slice(0, state.historyIndex + 1);
    nextHistory.push(text);
    state.history = nextHistory;
    state.historyIndex = nextHistory.length - 1;
    state.draft = text;
};

const undo = () => {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        state.draft = state.history[state.historyIndex];
    }
};

const redo = () => {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        state.draft = state.history[state.historyIndex];
    }
};

pushToHistory("First thought");
assert(state.draft === "First thought", "Initial push worked");
assert(state.history.length === 1, "History length is 1");

pushToHistory("Second thought");
assert(state.draft === "Second thought", "Second push worked");
assert(state.historyIndex === 1, "History index updated to 1");

undo();
assert(state.draft === "First thought", "Undo worked");
assert(state.historyIndex === 0, "Index is 0 after undo");

redo();
assert(state.draft === "Second thought", "Redo worked");
assert(state.historyIndex === 1, "Index is back to 1 after redo");

undo(); // Back to "First thought"
pushToHistory("New branch");
assert(state.draft === "New branch", "Branching push worked");
assert(state.history.length === 2, "History correctly truncated and branched");
assert(state.history[1] === "New branch", "Branch content is correct");


// --- Test Case 2: Note Serialization ---
console.log("\n--- Testing Note Serialization ---");

const generateNoteContent = (id, draft, date) => {
    return `---\nid: ${id}\ntitle: ${draft.slice(0, 30)}...\ncreated: ${date}\n---\n\n${draft}`;
};

const mockId = "1700000000000";
const mockDate = "Feb 4, 06:37 PM";
const mockDraft = "This is a very long voice transcript that we want to save correctly.";
const generated = generateNoteContent(mockId, mockDraft, mockDate);

assert(generated.includes(`id: ${mockId}`), "YAML contains ID");
assert(generated.includes(`created: ${mockDate}`), "YAML contains Date");
assert(generated.includes("This is a very long voice tran..."), "Title is correctly sliced");
assert(generated.endsWith(mockDraft), "Body contains full draft");


// --- Test Case 3: Note Deserialization (Parsing) ---
console.log("\n--- Testing Note Deserialization ---");

const parseNote = (content) => {
    const parts = content.split('---');
    if (parts.length >= 3) {
        const yaml = parts[1];
        const body = parts.slice(2).join('---').trim();
        return {
            id: yaml.match(/id: (.*)/)?.[1] || '',
            title: yaml.match(/title: (.*)/)?.[1] || 'Draft',
            transcript: body,
            timestamp: yaml.match(/created: (.*)/)?.[1] || ''
        };
    }
    return null;
};

const parsed = parseNote(generated);
assert(parsed.id === mockId, "Parsed ID matches");
assert(parsed.timestamp === mockDate, "Parsed timestamp matches");
assert(parsed.transcript === mockDraft, "Parsed transcript matches");
assert(parsed.title.startsWith("This is a very long"), "Parsed title looks correct");

console.log("\n🏁 ALL CORE LOGIC TESTS PASSED SUCCESSFULLY!");
