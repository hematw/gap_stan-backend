const generateEventMessage = (eventData, user) => {
    const { type, createdBy, targetUser } = eventData;

    const isYou = (userId) => userId === user.id;

    switch (type) {
        case "user_added":
            if (isYou(targetUser._id)) {
                return `${targetUser.firstName || targetUser.username} added you to the chat`;
            } else if (isYou(createdBy._id)) {
                return `You added ${targetUser.firstName || targetUser.username}`;
            } else {
                return `${createdBy.firstName || createdBy.username} added ${targetUser.firstName || targetUser.username
                    }`;
            }

        case "user_left":
            return `${targetUser.firstName || targetUser.username} left the chat`;

        case "user_removed":
            if (isYou(targetUser._id)) {
                return `You were removed from the chat`;
            } else {
                return `${targetUser.firstName || targetUser.username
                    } was removed from the chat`;
            }

        case "user_joined":
            return `${targetUser.firstName || targetUser.username} joined the chat`;

        case "call_started":
            return `${createdBy.firstName || createdBy.username} started a call`;

        case "call_missed":
            return `Missed call from ${createdBy.firstName || createdBy.username}`;
       
        case "made_admin":
            return `${createdBy.firstName || createdBy.username} make ${targetUser.firstName || targetUser.username} as Admin`;
       
        case "remove_admin":
            return `${createdBy.firstName || createdBy.username} make ${targetUser.firstName || targetUser.username} as Admin`;

        default:
            return `An event occurred`;
    }
};

export default generateEventMessage