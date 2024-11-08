import React, { useEffect, useRef, useState } from 'react';
import { doc, getDoc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import { db, auth } from "../firebase/firebase.jsx";
import styles from './Message.module.css';
import HeaderPage from './HeaderPage.jsx';
import { text } from '@fortawesome/fontawesome-svg-core';

function Message({ user }) {
    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [messageId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatUser, setChatUser] = useState(null);
    const [input, setInput] = useState("")
    const [newUser, setNewUser] = useState(null)
    const chatBoxRef = useRef(null);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [chatData]);

    const loadUserData = async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();
            setUserData(userData);
            await updateDoc(userRef, {
                lastSeen: Date.now(),
            });
            setInterval(async () => {
                if (auth.currentUser) {
                    await updateDoc(userRef, {
                        lastSeen: Date.now(),
                    });
                }
            }, 60000); // Update every minute
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    };

    useEffect(() => {
        if (user) {
            loadUserData(user.uid); // Fetch user data when the component mounts
        }
    }, [user]);

    useEffect(() => {
        if (userData) {
            const chatRef = doc(db, 'chats', user.uid); // Reference to the user's chat document
            const unSub = onSnapshot(chatRef, async (res) => {
                const chatItems = res.data().chatsData || [];
                const tempData = [];
    
                // Fetch user data for each chat participant (rId)
                for (const item of chatItems) {
                    const userRef = doc(db, 'users', item.rId); // Get user document for each rId
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.data();
                    
                    tempData.push({ ...item, userData });
                }
    
                setChatData(tempData.sort((a, b) => b.updatedAt - a.updatedAt)); // Sort by updatedAt
                setLoading(false);
            });
    
            return () => {
                unSub(); // Unsubscribe when the component unmounts
            };
        }
    }, [userData]);

    const setChat = async (item) => {
        setMessagesId(item.messageId); // Set the selected user's data in chatUser
        setChatUser(item)
        console.log(chatUser.rId)
    }

    const sendMessage = async () => {
        try {
            if (input && messageId) {
                await updateDoc(doc(db, 'messages', messageId),{
                    messages: arrayUnion({
                        sId:userData.id,
                        text:input,
                        createdAt:new Date()
                    })
                })
                const userIDs = [chatUser.rId, userData.id];

                userIDs.forEach(async (id) => {
                    const userChatsRef = doc(db, 'chats', id);
                    const userChatsSnapshot = await getDoc(userChatsRef);

                    if (userChatsSnapshot.exists()) {
                        const userChatData = userChatsSnapshot.data();
                        const chatIndex = userChatData.chatsData.findIndex((c)=>c.messageId == messageId);
                        userChatData.chatsData[chatIndex].lastMessage = input.slice(0,30);
                        userChatData.chatsData[chatIndex].updatedAt = Date.now();
                        if (userChatData.chatsData[chatIndex].rId === userData.id) {
                            userChatData.chatsData[chatIndex].messageSeen = false;
                        }
                        await updateDoc(userChatsRef, {
                            chatsData:userChatData.chatsData
                        })
                    }
                })
            }
        }catch (error){
            console.log(error);
        }
        setInput("");
    };
    
    useEffect(() => {
        if (messageId) {
            const unSub = onSnapshot(doc(db, 'messages', messageId), (res) => {
                setMessages(res.data().messages);
                console.log(res.data().messages);
            });
            return () => {
                unSub();
            };
        }
    }, [messageId]);
    

    return (
        <> 
            <div className={styles.containerPage}>
                <HeaderPage user={user} />
                <div className={styles.messagePage}>
                    <div className={styles.messageBox}>
                        <div className={styles.headerText}>Messages</div>
                        <div className={styles.userPlaceHolder}>
                        {loading ? (
                            <div>Loading users...</div>
                        ) : (
                            chatData.map((chat, index) => (
                                <div onClick={()=>setChat(chat)}key={index} className={styles.user}>
                                    <div className={styles.profileImage}>
                                        {chat.userData.profileImage ? (
                                            <img
                                                src={chat.userData.profileImage} // Use the URL from Firestore
                                                alt={`${chat.userData.username}'s profile`}
                                                className={styles.profileImg} // Optionally add a custom class for styling
                                            />
                                        ) : (
                                            <img
                                                src="path/to/default/image.jpg" // Fallback to a default image if profileImage is missing
                                                alt="Default profile"
                                                className={styles.profileImg} // Optionally add a custom class for styling
                                            />
                                        )}
                                    </div>
                                    <div className={styles.details}>
                                        <div className={styles.userName}>
                                            {chat.userData.username}
                                        </div>
                                        <div className={styles.lastMessage}>
                                            {chat.lastMessage || ""}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    </div>
                    <div className={styles.messageChats}>
                        <div className={styles.messageHeader}>
                            {chatUser ? chatUser.userData.username : "Inbox"}
                        </div> {/* Header at the top */}
                        <div className={styles.chatBox} ref={chatBoxRef}>
                            {messages.map((message, index) => (
                                <div key={index}>
                                    {message.sId === userData.id ? (
                                        // Current user's message
                                        <div className={styles.loggedInUserDetails}>
                                            <div className={styles.messages}>{message.text}</div>
                                        </div>
                                    ) : (
                                        // Other user's message
                                        <div className={styles.otherUserDetails}>
                                            <div className={styles.senderProfileImage}></div>
                                            <div className={styles.messages}>{message.text}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className={styles.inputContainer}>
                            <div className={styles.inputBox}>
                                <input
                                    onChange={(e) => setInput(e.target.value)}
                                    value={input}
                                    type="text"
                                    placeholder="Send a message..."
                                />
                            </div>
                            <button onClick={sendMessage} className={styles.sendButton}>
                                <i className="fa-solid fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

}

export default Message;