package com.info.shems.repository;

import com.info.shems.model.Recommendation;
import com.info.shems.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    List<Recommendation> findByUserOrderByCreatedAtDesc(User user);
}
