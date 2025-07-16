export default function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="flex space-x-2">
        {[...Array(3)].map((_, i) => (
          <span
            key={i}
            className={`size-3 rounded-full bg-bg-2 animate-bounce`}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
