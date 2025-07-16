export default function Loader() {
  return (
    <div className="h-6 flex items-end justify-start z-50">
      <div className="flex space-x-1.5">
        {[...Array(3)].map((_, i) => (
          <span
            key={i}
            className={`size-2.5 rounded-full bg-bg-2 animate-bounce`}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
