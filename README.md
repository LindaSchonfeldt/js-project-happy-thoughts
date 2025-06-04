# Happy Thoughts

[![Netlify Status](https://api.netlify.com/api/v1/badges/8131bd8a-605d-4338-89f7-97ca5fcc0cc4/deploy-status)](https://app.netlify.com/sites/creative-hotteok-2e5655/deploys)

## High-level map of "Happy Thoughts"

Here's a high-level map of the "Happy Thoughts" app and how the pieces fit together:

1. **App.jsx**  
   • Root of your UI.  
   • Calls useThoughts() to:  
    – fetch all existing thoughts on mount (GET /thoughts)  
    – expose `thoughts`, `loading`, `error`, a helper `addThought()` (for adding new items), and `newThoughtId` (for "just added" animations).  
   • Renders:  
    – a `<Loader/>` or error message while loading  
    – `<ThoughtForm onSubmit={addThought}/>` for the post‐form  
    – A list of `<Thought/>` items by mapping over `thoughts`
   – Pagination UI with `<LoadMoreButton/>` component

2. **useThoughts.js**  
   • Manages the array of thoughts in state with pagination support.  
   • `fetchThoughts(pageNum)` calls api.getThoughts() with page parameters, handles loading/error, populates state.  
   • `loadMore()` function to fetch the next page of thoughts.  
   • `addThought(messageOrObj)` is your optimistic‐UI helper—creates a temp object, inserts it immediately.  
   • `createAndRefresh(serverThought)` combines optimistic update with server response.  
   • Internally tracks "in progress" fetch/post operations with refs to avoid duplicates.
   • Manages pagination state: `page`, `hasMore`, `totalPages`.

3. **api.js**  
   • Central-place for all network calls.  
   • Uses environment variables for API base URL with fallback.  
   • `getThoughts(page, limit)` → fetch GET /thoughts with pagination → JSON array  
   • `postThought(message)` → deduplicateRequest wrapper → fetch POST /thoughts → JSON of the new thought  
   • `likeThought(id)` → fetch POST /thoughts/:id/like → JSON with updated hearts  
   • `deduplicateRequest(key, fn)` prevents firing the exact same request twice in flight.

4. **usePostThought.js**  
   • Handles the **form** state: `message`, `isPosting`, `error`, `remainingChars`.  
   • `handleInputChange()` updates the text and clears errors.  
   • `postThought()` does client-side validation, guards against double-submit with `isSubmittingRef`, calls the API (or an injected fallback), and on success:  
    – clears the input  
    – invokes your `onSuccess(data)` callback (which, in your form, is `addThought(data)` from useThoughts)

5. **ThoughtForm.jsx**  
   • UI for the happy-thought input form.  
   • Takes an `onSubmit` prop (wired to `addThought` in App).  
   • Uses usePostThought to:  
    – bind `value`/`onChange`  
    – disable the button while posting or on invalid input  
    – handle submission via the hook's `handleSubmit` (which calls postThought + your onSuccess)

6. **Thought.jsx**  
   • Renders a single thought bubble: the text, date, and a heart-button.  
   • Receives props like `message`, `createdAt`, `hearts`, and uses `useLikeSystem` hook for like functionality.
   • Handles format validation for message and like count display.

7. **useLikeSystem.js**  
   • Manages like state for individual thoughts.
   • Tracks if current user has liked a post using localStorage.
   • Provides optimistic UI updates when liking.
   • Calls api.likeThought(id) when you click a heart.
   • Updates local storage to persist user's likes between sessions.

## Flow when you post a new thought

1. User types → `handleInputChange` in usePostThought → updates `message`.
2. User clicks "Send" → `<StyledForm onSubmit={handleSubmit}>` → calls usePostThought.handleSubmit → prevents default, calls postThought().
3. postThought() validates, sets `isSubmittingRef`, calls `api.postThought(message)`.
4. On success, postThought clears the input and calls `onSuccess(data)` → this is the `addThought(data)` you passed in.
5. addThought(data) in useThoughts merges the real server object into your `thoughts` array (and clears your temp placeholder).
6. App re-renders, the new `<Thought/>` appears at the top with highlight animation.

## Flow for pagination

1. Initial load calls fetchThoughts(1) to get the first page.
2. When user scrolls to bottom or clicks "Load More", loadMore() is called.
3. loadMore() checks if hasMore is true and not currently loading, then calls fetchThoughts(page + 1).
4. New thoughts are appended to the existing thoughts array.
5. Pagination info (page, hasMore, totalPages) is updated.
6. UI reflects the current pagination state.

## API Base URLs

- Development: Configured via REACT_APP_API_BASE_URL in .env
- Production: https://happy-thoughts-api-yn3p.onrender.com
- Alternative: https://happy-thoughts-api-4ful.onrender.com

Everything that talks to the network lives in api.js; your custom hooks handle orchestration (state, optimistic updates, duplicate prevention), and components render the UI and wire user events back into those hooks.
