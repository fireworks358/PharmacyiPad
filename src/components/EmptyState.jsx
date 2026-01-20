export default function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <p className="text-nhs-grey text-nhs-body text-center">
        {message}
      </p>
    </div>
  );
}
