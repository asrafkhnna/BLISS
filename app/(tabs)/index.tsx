import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("https://bliss-1pqu.vercel.app/api");
      const data = await res.json();
      setPosts(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "black" }}>
        <ActivityIndicator color="white" />
        <Text style={{ color: "white", marginTop: 10 }}>Loading the beats...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black", paddingTop: 50 }}>
      <Text style={{ color: "white", fontSize: 24, fontWeight: "bold", padding: 15 }}>BLISS</Text>
      <FlatList
        data={posts}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 15, margin: 10, backgroundColor: "#111", borderRadius: 10 }}>
            <Text style={{ color: "white", fontSize: 16 }}>{item.caption || item.content || "No caption"}</Text>
          </View>
        )}
      />
    </View>
  );
}
