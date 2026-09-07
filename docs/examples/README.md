# Modal reference

`Modals.tsx.txt` preserves the original AI Studio demo forms for design reference. It is not imported or compiled. The simulated clinical updates and refill submissions are not supported app features.

The app reads fixtures directly and keeps UI state in the component using it. Action buttons for unimplemented record changes are disabled. Navigation uses Next links or `router.push`.

For a future implemented interaction, render `Modal` from `src/components/Modals.tsx` inside its owning client component:

```tsx
const [open, setOpen] = useState(false);

return <>
  <button onClick={() => setOpen(true)}>Open details</button>
  {open && <Modal title="Details" onClose={() => setOpen(false)}>
    <p>Modal content lives here.</p>
  </Modal>}
</>;
```

The native dialog provides focus containment, Escape dismissal, and focus restoration. Unmount it to close it; no global provider or modal registry is needed.
