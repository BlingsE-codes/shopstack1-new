import React, { useEffect } from "react";
import Landlordnavbar from "../components/Landlordnavbar";

import { useShopStore } from "../store/shop-store"; 
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { toast } from "sonner";;
import "../styles/posnavbar.css";


const Landlordpage = ({children}) => {
  const { shopId: urlShopId } = useParams();
  const { shop, setShop } = useShopStore();
  
  useEffect(() => {
    const initializeHouse = async () => {
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
        console.error("Error initializing House:", err);
        toast.error("Failed to load House data");
      }
    };
    
    if (urlShopId) {
      initializeHouse();
    }
  }, [urlShopId, shop, setShop]);

 

  return (
     <div className="dashboard1-wrapper">
           <Landlordnavbar id={urlShopId}/>
       <div className="dashboard1-content">
        
         {children}
       </div>
    </div>

   

  );
};

export default Landlordpage;