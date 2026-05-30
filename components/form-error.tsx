export function FormError({ error }: { error?: string[] }) {
  if (!error) return null;
  return error.map((err, index) => (
    <div key={index} className="text-red-500 text-xs italic">
      {err}
    </div>
  ));
}
