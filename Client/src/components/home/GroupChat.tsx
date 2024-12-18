import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useOutletContext, useParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import FetchApiWrapper from "@/utils/FetchApiWrapper";
import ChatHeader from "../utils/ChatHeader";
import ChatDisplay from "../utils/ChatDisplay";
import { Socket } from "socket.io-client";
// import "react-chat-elements/dist/main.css";
// import { MessageBox } from "react-chat-elements";

// type Group = {
//   _id: string;
//   name: string;
//   members: [];
//   admin: string;
// };

// type ResponseData = {
//   data: [];
//   success: boolean;
//   statusCode: number;
//   nextCursor: Date;
// };

type GroupMessage = {
  _id: string;
  senderId: string;
  groupId: string;
  receiverId: null; // Explicitly stating as null for group messages
  isRead: boolean;
  timeStamp: Date;
  content: string;
  isGroupMessage: boolean;
};

type ContextType = { socket: Socket | null; activeUsers: [] };

const GroupChat = () => {
  const { id } = useParams();
  const dispatch: AppDispatch = useDispatch();

  const url =
    import.meta.env.VITE_NODE_ENV == "production"
      ? import.meta.env.VITE_PROD_BACKEND_URL
      : import.meta.env.VITE_DEV_BACKEND_URL;

  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const { _id } = useSelector((state: RootState) => state.user.data);

  const [newMessage, setNewMessage] = useState("");

  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);

  const { socket, activeUsers } = useOutletContext<ContextType>();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(id); // Create a ref for chatPartnerId
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(
    async (cursor: string | null = null) => {
      if (!id) return;
      setLoading(true);
      const fullUrl = new URL(`${url}/api/groups/get-group-messages/${id}`);
      const { response, data } = await FetchApiWrapper(fullUrl, {}, dispatch);
      if (response.ok) {
        const { data: messages, nextCursor, success } = data;
        // console.log(nextCursor, messages);
        if (success) {
          setGroupMessages((prevMessages) =>
            cursor ? [...prevMessages, ...messages] : messages
          );
          setHasMoreMessages(nextCursor == null ? false : true);
          setNextCursor(nextCursor);

          const scrollArea = scrollAreaRef.current;
          if (scrollArea) {
            scrollArea.scrollTop = scrollArea.scrollHeight;
          }
        }
      }
      setLoading(false);
    },
    [id, dispatch]
  );

  const handleFetchMore = useCallback(async () => {
    setLoading(true);
    const fullUrl = new URL(`${url}/api/groups/get-group-messages/${id}`);
    if (nextCursor) {
      fullUrl.searchParams.set("nextCursor", nextCursor);
    }
    // console.log("fullUrl", fullUrl);
    const { response, data } = await FetchApiWrapper(fullUrl, {}, dispatch);
    if (response.ok) {
      const { data: messages, nextCursor, success } = data;

      if (success) {
        setGroupMessages((prevMessages) => [...prevMessages, ...messages]);
        setNextCursor(nextCursor);
        setHasMoreMessages(nextCursor == null ? false : true);
      }
    }
    setLoading(false);
  }, [dispatch, id, nextCursor]);

  const handleSocketSendMessage = () => {
    if (socket) {
      socket.emit("send-msg", {
        content: newMessage,
        senderId: _id,
        isGroupMessage: true,
        groupId: id,
        timeStamp: Date.now(), // Add this to help with creating unique keys
      });
      setNewMessage("");
    }
  };

  // get Group

  // Initial message fetch on component mount (this will run only once)
  useEffect(() => {
    setGroupMessages([]);
    setHasMoreMessages(true);
    setNextCursor(null);
    fetchMessages(); // Fetch the first batch of messages on load
  }, [id, fetchMessages]);

  useEffect(() => {
    // console.log("rendered main useEffect");
    if (!socket) return;

    socket.emit("join-group", {
      groupId: idRef.current,
      userId: _id,
    });

    const handleNewUserConnected = (data: object) => {
      console.log(data);
    };

    const handleRoomJoined = (data: object) => {
      console.log(data);
    };

    const handleRoomJoinedNotice = (data: object) => {
      console.log(data);
    };

    const handleGroupLeft = (data: object) => {
      console.log(data);
    };

    const handleGroupLeftNotice = (data: object) => {
      console.log(data);
    };

    const handleReceiveMessage = (data: {
      data: {
        _id: string;
        content: string;
        senderId: string;
        groupId?: string;
        receiverId?: string;
        isGroupMessage: boolean;
        timeStamp: Date;
      };
    }) => {
      const { isGroupMessage } = data.data;
      if (isGroupMessage) {
        setGroupMessages((prevState: GroupMessage[]) => [
          {
            _id: data.data._id,
            content: data.data.content,
            senderId: data.data.senderId,
            groupId: data.data.groupId || "", // Ensure it's a string
            receiverId: null, // Assuming group message doesn't have receiverId
            isRead: false, // Set default value or modify based on your logic
            timeStamp: new Date(data.data.timeStamp), // Ensure it's a Date object
            isGroupMessage: true, // Set based on your requirements
          },
          ...prevState,
        ]);
      }
    };
    const handleAlreadyJoined = (data: { message: string }) => {
      console.log(data);
    };

    socket.on("new-user-connected", handleNewUserConnected);

    socket.on("already-joined", handleAlreadyJoined);

    socket.on("room-joined", handleRoomJoined);

    socket.on("room-joined-notice", handleRoomJoined);

    socket.on("group-left", handleGroupLeft);

    socket.on("group-left-notice", handleGroupLeftNotice);

    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.off("new-user-connected", handleNewUserConnected);
      socket.off("room-joined", handleRoomJoined);
      socket.off("room-joined-notice", handleRoomJoinedNotice);
      socket.off("group-left", handleGroupLeft);
      socket.off("group-left-notice", handleGroupLeftNotice);
      socket.off("receive-message", handleReceiveMessage);
    };
  }, [_id, socket]);

  // for when we change the user so that groupId changes
  useEffect(() => {
    if (socket && id) {
      if (idRef.current == id) return;
      const data = { groupId: idRef.current, userId: _id };
      socket.emit("leave-group", data);

      // console.log("Switching group from:", idRef.current, "to:", id);

      data.groupId = id;
      socket.emit("join-group", data);
    }

    idRef.current = id; // Update the id reference
  }, [socket, id, _id]);

  return (
    <div
      className="p-4 h-screen grid"
      style={{ gridTemplateRows: "75px 1fr 75px" }}
    >
      <ChatHeader
        id={id}
        isActive={null}
        activeUsers={activeUsers}
        url={new URL(`${url}/api/groups/get-group-by-id`)}
      />
      <ChatDisplay
        scrollTimeoutRef={scrollTimeoutRef}
        loading={loading}
        messages={groupMessages}
        hasMoreMessages={hasMoreMessages}
        handleFetchMore={handleFetchMore}
      />
      <div className="flex rounded-lg items-center mt-3 px-3 w-full bg-gray-100">
        {/* Input field and Send button */}
        <Input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key == "Enter") {
              e.preventDefault();
              handleSocketSendMessage();
            }
          }}
          className="flex-1 mr-2 border-2 border-black"
        />
        <Button className="px-10" onClick={handleSocketSendMessage}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default GroupChat;
