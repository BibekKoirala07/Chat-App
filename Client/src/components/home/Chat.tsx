import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input"; // Adjust import path as needed
import { Button } from "@/components/ui/button"; // Adjust import path as needed
// Adjust import path as needed
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import FetchApiWrapper from "@/utils/FetchApiWrapper";
import ChatHeader from "../utils/ChatHeader";
import ChatDisplay from "../utils/ChatDisplay";
import { Socket } from "socket.io-client";

interface Message {
  _id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: Date;
  timeStamp: Date;
  updatedAt?: Date;
}

interface RegisterResponse {
  userId: string;
  socketId: string;
}

type ContextType = { socket: Socket | null; activeUsers: string[] };

const Chat = () => {
  const dispatch: AppDispatch = useDispatch();

  const url =
    import.meta.env.VITE_NODE_ENV == "production"
      ? import.meta.env.VITE_PROD_BACKEND_URL
      : import.meta.env.VITE_DEV_BACKEND_URL;

  const { socket, activeUsers } = useOutletContext<ContextType>();

  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);

  const { _id } = useSelector((state: RootState) => state.user.data);
  const { id: chatPartnerId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatPartnerIdRef = useRef<string | undefined>(chatPartnerId); // Create a ref for chatPartnerId

  useEffect(() => {
    chatPartnerIdRef.current = chatPartnerId; // Update ref value whenever chatPartnerId changes
  }, [chatPartnerId]);

  const handleFetchMore = useCallback(async () => {
    setLoading(true);
    if (!nextCursor || !chatPartnerId) return;
    const fullUrl = new URL(`${url}/api/messages/history`);
    fullUrl.searchParams.set("nextCursor", nextCursor);
    fullUrl.searchParams.set("senderId", _id);
    fullUrl.searchParams.set("receiverId", chatPartnerId);
    // console.log("fullUrl", fullUrl);
    const { response, data } = await FetchApiWrapper(fullUrl, {}, dispatch);
    if (response.ok) {
      const { data: messages, nextCursor, success } = data;

      if (success) {
        setMessages((prevMessages) => [...prevMessages, ...messages]);
        setNextCursor(nextCursor);
        setHasMoreMessages(() => (nextCursor == null ? false : true));
      }
    }
    setLoading(false);
  }, [dispatch, nextCursor, _id, chatPartnerId]);

  const fetchMessages = useCallback(async () => {
    const fullUrl = new URL(`${url}/api/messages/history`);
    fullUrl.searchParams.append("senderId", _id);
    fullUrl.searchParams.append("receiverId", chatPartnerId ?? "");
    const { response, data } = await FetchApiWrapper(fullUrl, {}, dispatch);
    // console.log("data", data);
    if (response.ok) {
      // console.log("data in response", data.data);
      const { nextCursor } = data;
      setNextCursor(nextCursor);
      setHasMoreMessages(nextCursor ? true : false);
      setMessages(data.data);
    }
  }, [chatPartnerId, dispatch, _id]);

  useEffect(() => {
    setMessages([]);
    setHasMoreMessages(true);
    setNextCursor(null);
    setLoading(false);

    fetchMessages();
  }, [chatPartnerId, fetchMessages]);

  useEffect(() => {
    // console.log("socket in chat.tsx", socket);
    if (!socket) return;
    // if (!socket.connected) return;
    // chatPartner is same as first as we don't want to reruns everytime chatPartnerId
    // changes so chatPartner remeain same even when click to next user and this causes pro
    // blem in "send-msg" socket event so we are going to use useRef
    // const newSocket = io("http://localhost:3000");
    // setSocket(newSocket);

    socket.on("new-user-connected", (data: RegisterResponse) => {
      console.log("new-user-connected", data);
    });

    socket.on("new-user-connected-notice", (data) => {
      console.log("new-user-connected-notice : ", data);
    });

    socket.on("user-disconnected", (data) => {
      console.log("user-disconnected", data);
    });

    socket.on("user-disconnected-notice", (data) => {
      console.log("user-disconnected-notice", data);
    });

    socket.on("receive-message", (data: { data: Message }) => {
      console.log(_id, chatPartnerId);
      // console.log("chatPartnerIdRef", chatPartnerIdRef.current);
      console.log("receive-message", data.data);
      if (
        data.data.senderId == _id &&
        data.data.receiverId == chatPartnerIdRef.current
      ) {
        console.log("here is it up");
        setMessages((prevState) => [data.data, ...prevState]);
      }
      if (
        data.data.senderId == chatPartnerIdRef.current &&
        data.data.receiverId == _id
      ) {
        console.log("here is it down");
        setMessages((prevState) => [data.data, ...prevState]);
      }
    });

    // socket.on("disconnect", () => {
    //   console.log("Disconnected from the server");
    // });

    socket.on("chat-message", (data: Message) => {
      console.log("chat-message in client", data);
    });
    // Cleanup on component unmount
    // return () => {
    //   socket.disconnect();
    // };
    // Cleanup function to remove the listener on component unmount
    return () => {
      socket.off("receive-message");
    };
  }, [_id, socket, chatPartnerId]);

  const socketSendMessage = () => {
    if (socket) {
      socket.emit("send-msg", {
        content: newMessage,
        senderId: _id,
        isGroupMessage: false,
        receiverId: chatPartnerIdRef.current,
        timeStamp: Date.now(), // Add this to help with creating unique keys
      });
      setNewMessage("");
    }
  };

  return (
    <div
      className="p-4 h-screen grid"
      style={{ gridTemplateRows: "75px 1fr 75px" }}
    >
      {chatPartnerId && (
        <ChatHeader
          isActive={
            activeUsers != null && activeUsers?.includes(chatPartnerId) ? 10 : 0
          }
          id={chatPartnerId}
          activeUsers={null}
          url={new URL(`${url}/api/auth/get-user`)}
        />
      )}
      <ChatDisplay
        scrollTimeoutRef={scrollTimeoutRef}
        loading={loading}
        messages={messages}
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
              socketSendMessage();
            }
          }}
          className="flex-1 mr-2 border-2 border-black"
        />
        <Button
          className="px-10"
          onClick={socketSendMessage}
          disabled={!newMessage.length}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default Chat;
