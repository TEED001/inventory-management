const ProfileImage = ({ name = "User Name", imageUrl, size = "md" }) => {
  // Size variants
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base"
  };

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return "US";
    const names = name.split(' ');
    let initials = names[0][0];
    if (names.length > 1) initials += names[names.length - 1][0];
    return initials.toUpperCase();
  };

  // Background colors based on name hash
  const getBackgroundColor = (name) => {
    if (!name) return "bg-indigo-500";
    const colors = [
      "bg-indigo-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500"
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${getBackgroundColor(name)} text-white font-medium shadow-sm`}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full rounded-full object-cover border-2 border-white"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <span className={imageUrl ? "hidden" : "flex items-center justify-center"}>
        {getInitials(name)}
      </span>
    </div>
  );
};

export default ProfileImage;