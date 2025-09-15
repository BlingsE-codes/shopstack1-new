import React, { useEffect } from "react";
import PosSidebar from "../components/posSidebar.jsx";
import PosDashboard from "../components/PosDashboard";
import Posnavbar from "../components/Posnavbar.jsx";
import "../styles/Posdashboard.css";
import "../styles/possidebar.css";
import "../styles/pospage.css";
import "../styles/posnavbar.css";
import { useShopStore } from "../store/shop-store.jsx";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { toast } from "sonner";


const Pospage = ({children}) => {
  const { shopId: urlShopId } = useParams();
  const { shop, setShop } = useShopStore();
  
  useEffect(() => {
    const initializeShop = async () => {
      if (shop?.id === urlShopId) return;
      
      try {
        const { data: shopData, error } = await supabase
          .from("shops")
          .select("*")
          .eq("id", urlShopId)
          .single();
        
        if (error) throw error;
        
        if (shopData) {
          setShop(shopData);
          localStorage.setItem("shop_id", shopData.id);
          localStorage.setItem("shop_name", shopData.name);
          if (shopData.logo_url) {
            localStorage.setItem("logo_url", shopData.logo_url);
          }
        }
      } catch (err) {
        console.error("Error initializing shop:", err);
        toast.error("Failed to load shop data");
      }
    };
    
    if (urlShopId) {
      initializeShop();
    }
  }, [urlShopId, shop, setShop]);

 

  return (
     <div className="dashboard1-wrapper">
           <Posnavbar id={urlShopId}/>
       <div className="dashboard1-content">
        
         {children}
       </div>
    </div>

   

  );
};

export default Pospage;