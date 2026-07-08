export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="alert alert-danger" role="alert">
      {message}
    </div>
  );
}
